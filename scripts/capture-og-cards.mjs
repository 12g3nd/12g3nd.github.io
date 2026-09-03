// One 1200x630 social card per transmission AND per poem -> public/og/<slug>.png
//
// Run locally and commit the PNGs, the same arrangement as capture-previews.mjs:
// the deploy workflow then stays a plain `npm ci && vite build` with no browser
// download in CI. scripts/prerenderPlugin.ts picks the files up if they exist
// and falls back to the site-wide card if they don't, so a missing card
// degrades instead of pointing at a 404.
//
// Re-run after adding a transmission or a poem, or after editing either
// template (og-post-card.html / og-poem-card.html).
//
// Transmissions and poems share one output directory, so their slugs share one
// namespace — two pieces with the same slug would overwrite each other's card.
// main() checks for that rather than letting the second one win silently.
//
// Usage: node scripts/capture-og-cards.mjs [slug ...]   (default: all)

import { chromium } from 'playwright';
import { readFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const OUT_DIR = path.resolve('public', 'og');
const POST_TEMPLATE = path.resolve('scripts', 'og-post-card.html');
const POEM_TEMPLATE = path.resolve('scripts', 'og-poem-card.html');

const WIDTH = 1200;
const HEIGHT = 630;

/** Largest title size we'll try, then step down until the card stops overflowing. */
const TITLE_MAX = 92;
/** The poem card's serif title starts calmer than the transmissions' Anton. */
const POEM_TITLE_MAX = 76;
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

/**
 * Same text-scrape trick for src/data/poems.ts. That file holds only the
 * records — the verse itself lives in poemContent.tsx — which is what keeps it
 * parseable as text rather than needing a TS loader and a React runtime.
 */
async function loadPoems() {
  const src = await readFile(path.resolve('src', 'data', 'poems.ts'), 'utf8');
  const body = src.slice(src.indexOf('export const poems'), src.indexOf('export const poemsSorted'));

  const poems = [];
  for (const block of body.matchAll(/\{\s*slug:([\s\S]*?)\n\s*\},/g)) {
    const chunk = block[1];
    const field = (name) => {
      const m = chunk.match(new RegExp(`${name}:\\s*(['"\`])([\\s\\S]*?)\\1`));
      return m ? m[2] : null;
    };
    const slug = chunk.match(/^\s*(['"])(.*?)\1/)?.[2];
    const date = field('date');
    const title = field('title');
    const blurb = field('blurb');
    if (slug && date && title && blurb) {
      poems.push({ slug, date, title, blurb, award: field('award') });
    }
  }
  if (!poems.length) throw new Error('parsed no poems out of src/data/poems.ts');
  return poems;
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

/**
 * Render one card. Shared by both kinds, because everything that differs
 * between them (template, tokens, how big the title may start) is a parameter
 * and everything that is fiddly (font readiness, the auto-fit, the shutter) is
 * not.
 */
async function shoot(page, { template, tokens, out, titleMax }) {
  let html = template;
  for (const [key, value] of Object.entries(tokens)) {
    // split/join rather than .replace(), which fills only the FIRST occurrence
    // — and a template's own doc comment mentioning a token counts as one, so
    // the single-shot version quietly spent AWARD on the comment and shipped a
    // card with a literal {{...}} printed on it.
    html = html.split(`{{${key}}}`).join(escapeHtml(value ?? ''));
  }

  const leftover = html.match(/\{\{[A-Z_]+\}\}/g);
  if (leftover) {
    throw new Error(`unsubstituted token(s) in ${path.basename(out)}: ${[...new Set(leftover)].join(', ')}`);
  }

  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  // Shrink the title until the whole card fits its 630px. Done in the browser
  // because only the browser knows how this font wraps this particular string.
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
    { max: titleMax, min: TITLE_MIN, step: TITLE_STEP }
  );

  await page.screenshot({ path: out, type: 'png' });
  const { size: bytes } = await stat(out);
  console.log(`ok (title ${size}px, ${Math.round(bytes / 1024)} KB)`);
}

async function main() {
  const only = process.argv.slice(2);
  const allPosts = await loadPosts();
  const allPoems = await loadPoems();

  // Both kinds write to public/og/<slug>.png, so a slug shared between a post
  // and a poem would mean one card silently overwriting the other — and the
  // prerenderer, which looks a card up by slug alone, would hand the wrong
  // image to whichever lost.
  const clash = allPosts.map((p) => p.slug).filter((s) => allPoems.some((p) => p.slug === s));
  if (clash.length) {
    console.error(`slug collision between a transmission and a poem: ${clash.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const posts = only.length ? allPosts.filter((p) => only.includes(p.slug)) : allPosts;
  const poems = only.length ? allPoems.filter((p) => only.includes(p.slug)) : allPoems;

  if (!posts.length && !poems.length) {
    const known = [...allPosts, ...allPoems].map((p) => p.slug).join(', ');
    console.error(`nothing matched. known: ${known}`);
    process.exitCode = 1;
    return;
  }

  const tx = numbering(allPosts);
  // Poems are numbered newest-first, matching poemsSorted/pageOf in poems.ts —
  // it is the page number the collection prints on the sheet.
  const order = [...allPoems].sort((a, b) => new Date(b.date) - new Date(a.date));
  const pageOf = new Map(order.map((p, i) => [p.slug, i + 1]));

  const postTemplate = await readFile(POST_TEMPLATE, 'utf8');
  const poemTemplate = await readFile(POEM_TEMPLATE, 'utf8');
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // Load a template from disk once so the Google Fonts <link> resolves against
  // a real origin; the substituted HTML is then swapped in per card.
  await page.goto(pathToFileURL(POST_TEMPLATE).href, { waitUntil: 'networkidle' });

  for (const post of posts) {
    process.stdout.write(`card ${tx.get(post.slug)} ${post.slug.padEnd(38)} `);
    await shoot(page, {
      template: postTemplate,
      out: path.join(OUT_DIR, `${post.slug}.png`),
      titleMax: TITLE_MAX,
      tokens: {
        TRANSMISSION: tx.get(post.slug),
        DATE: post.date,
        TITLE: post.title,
        ABSTRACT: post.abstract,
      },
    });
  }

  for (const poem of poems) {
    process.stdout.write(`card POEM ${String(pageOf.get(poem.slug)).padEnd(11)} ${poem.slug.padEnd(38)} `);
    await shoot(page, {
      template: poemTemplate,
      out: path.join(OUT_DIR, `${poem.slug}.png`),
      // The poem card sets its title in a serif at a calmer size than the
      // transmissions' Anton, and starts lower so short titles are not absurd.
      titleMax: POEM_TITLE_MAX,
      tokens: {
        SLUG: poem.slug,
        DATE: poem.date,
        TITLE: poem.title,
        BLURB: poem.blurb,
        AWARD: poem.award ?? '',
        AWARD_CLASS: poem.award ? 'award' : '',
        PAGE: String(pageOf.get(poem.slug)),
        TOTAL: String(allPoems.length),
      },
    });
  }

  await browser.close();
}

main();
