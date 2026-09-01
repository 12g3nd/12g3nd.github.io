// One 1200x630 social card per transmission -> public/og/<slug>.png
//
// Run locally and commit the PNGs, the same arrangement as capture-previews.mjs:
// the deploy workflow then stays a plain `npm ci && vite build` with no browser
// download in CI. scripts/prerenderPlugin.ts picks the files up if they exist
// and falls back to the site-wide card if they don't, so a missing card
// degrades instead of pointing at a 404.
//
// Re-run after adding a transmission, or after editing scripts/og-post-card.html.
//
// Usage: node scripts/capture-og-cards.mjs [slug ...]   (default: all)

import { chromium } from 'playwright';
import { readFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const OUT_DIR = path.resolve('public', 'og');
const TEMPLATE = path.resolve('scripts', 'og-post-card.html');

const WIDTH = 1200;
const HEIGHT = 630;

/** Largest title size we'll try, then step down until the card stops overflowing. */
const TITLE_MAX = 92;
const TITLE_MIN = 44;
const TITLE_STEP = 4;

/**
 * posts.ts is TypeScript, and this is a plain .mjs script run by node with no
 * transform in front of it, so the post list is read as text rather than
 * imported. The fields are simple string literals; a real parse would mean
 * pulling in a TS loader to read five records.
 */
async function loadPosts() {
  const src = await readFile(path.resolve('src', 'data', 'posts.ts'), 'utf8');
  const body = src.slice(src.indexOf('export const posts'), src.indexOf('export const postsSorted'));

  const posts = [];
  for (const block of body.matchAll(/\{\s*slug:([\s\S]*?)\n\s*\},/g)) {
    const chunk = block[1];
    const field = (name) => {
      const m = chunk.match(new RegExp(`${name}:\\s*(['"\`])([\\s\\S]*?)\\1`));
      return m ? m[2] : null;
    };
    const slug = chunk.match(/^\s*(['"])(.*?)\1/)?.[2];
    const date = field('date');
    const title = field('title');
    const abstract = field('abstract');
    if (slug && date && title && abstract) posts.push({ slug, date, title, abstract });
  }
  if (!posts.length) throw new Error('parsed no posts out of src/data/posts.ts');
  return posts;
}

/** TRANSMISSION_NN by chronological position — matches transmissionOf() in posts.ts. */
function numbering(posts) {
  const chronological = [...posts].sort((a, b) => new Date(a.date) - new Date(b.date));
  return new Map(
    chronological.map((p, i) => [p.slug, `TRANSMISSION_${String(i + 1).padStart(2, '0')}`])
  );
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function main() {
  const only = process.argv.slice(2);
  const all = await loadPosts();
  const posts = only.length ? all.filter((p) => only.includes(p.slug)) : all;

  if (!posts.length) {
    console.error(`no posts matched. known: ${all.map((p) => p.slug).join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const tx = numbering(all);
  const template = await readFile(TEMPLATE, 'utf8');
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // Load the template from disk once so the Google Fonts <link> resolves against
  // a real origin; the substituted HTML is then swapped in per post.
  await page.goto(pathToFileURL(TEMPLATE).href, { waitUntil: 'networkidle' });

  for (const post of posts) {
    const out = path.join(OUT_DIR, `${post.slug}.png`);
    process.stdout.write(`card ${tx.get(post.slug)} ${post.slug.padEnd(32)} `);

    const html = template
      .replace('{{TRANSMISSION}}', escapeHtml(tx.get(post.slug)))
      .replace('{{DATE}}', escapeHtml(post.date))
      .replace('{{TITLE}}', escapeHtml(post.title))
      .replace('{{ABSTRACT}}', escapeHtml(post.abstract));

    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    // Shrink the title until the whole card fits its 630px. Done in the browser
    // because only the browser knows how Anton wraps this particular string.
    //
    // The card clips at 630px by design (`overflow: hidden` on html/body), which
    // also means scrollHeight can never report overflow — it is clamped to the
    // viewport. Overflow is therefore unhidden for the duration of the measure
    // and restored before the shutter, so a title too long to fit is caught here
    // instead of being quietly guillotined in the PNG.
    const size = await page.evaluate(
      ({ max, min, step }) => {
        const root = document.documentElement;
        const prevHtml = root.style.overflow;
        const prevBody = document.body.style.overflow;
        root.style.overflow = 'visible';
        document.body.style.overflow = 'visible';

        let chosen = min;
        for (let s = max; s >= min; s -= step) {
          root.style.setProperty('--title-size', `${s}px`);
          if (document.body.scrollHeight <= window.innerHeight) {
            chosen = s;
            break;
          }
        }

        root.style.setProperty('--title-size', `${chosen}px`);
        root.style.overflow = prevHtml;
        document.body.style.overflow = prevBody;
        return chosen;
      },
      { max: TITLE_MAX, min: TITLE_MIN, step: TITLE_STEP }
    );

    await page.screenshot({ path: out, type: 'png' });
    const { size: bytes } = await stat(out);
    console.log(`ok (title ${size}px, ${Math.round(bytes / 1024)} KB)`);
  }

  await browser.close();
}

main();
