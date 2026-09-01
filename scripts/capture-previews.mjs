// Project card preview images, captured from the live sites.
//
// The Projects page shows a thumbnail per card. Hand-saved screenshots go stale
// the moment one of these sites is redesigned and nobody remembers which file
// came from where, so the captures are scripted and the mapping lives here.
//
// Only projects with a public URL are listed. ai-rule-miner is a CLI, lacquer is
// a desktop app and frame-loop is a browser extension — there is no page to
// photograph, and a mocked-up screenshot would be a worse lie than the
// placeholder treatment Projects.css already draws for them.
//
// reducedMotion: 'reduce' is doing real work here, same as in capture-pdf.mjs:
// fi99.ca hides its hero behind an `html.motion` class until GSAP boots and
// bails out of that entirely under reduced motion, so the page paints its final
// state immediately instead of being photographed mid-reveal.
//
// Usage: node scripts/capture-previews.mjs [name ...]   (default: all)

import { chromium } from 'playwright';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('public', 'projects');

// 2:1 — .project-card__preview is a 170px-tall `object-fit: contain` box, so a
// wide capture fills it instead of letterboxing into a strip.
const VIEWPORT = { width: 1280, height: 640 };

// JPEG, not PNG: these are photographic full-page captures where PNG lands
// around a megabyte each (see public/PlotONPreview.png) for no visible gain at
// 170px tall.
const QUALITY = 82;

// `viewport` overrides the default where a site's first screen is shorter than
// 640px of content — WR!TE opens on a library list that is mostly empty page,
// and a contain-fitted thumbnail of whitespace shows nothing at 170px tall.
const TARGETS = [
  { name: 'fi99', url: 'https://fi99.ca' },
  { name: 'fallow', url: 'https://fallow.fi99.ca' },
  { name: 'write', url: 'https://write.fi99.ca', viewport: { width: 1280, height: 420 } },
  { name: 'verdant', url: 'https://fi99.ca/research/verdant/' },
  { name: 'courtiq', url: 'https://fantasy-agent-kappa.vercel.app' },
];

async function main() {
  const only = process.argv.slice(2);
  const targets = only.length ? TARGETS.filter((t) => only.includes(t.name)) : TARGETS;

  if (!targets.length) {
    console.error(`no targets matched. known: ${TARGETS.map((t) => t.name).join(', ')}`);
    process.exitCode = 1;
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();

  const failed = [];

  for (const { name, url, viewport } of targets) {
    const out = path.join(OUT_DIR, `${name}.jpg`);
    process.stdout.write(`capturing ${name.padEnd(8)} ${url} ... `);
    try {
      await page.setViewportSize(viewport ?? VIEWPORT);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.evaluate(() => document.fonts.ready);
      // Scroll-triggered reveals on these sites arm on load; give the first
      // paint a beat to settle before the shutter.
      await page.waitForTimeout(1200);
      await page.screenshot({ path: out, type: 'jpeg', quality: QUALITY });
      const { size } = await stat(out);
      console.log(`ok (${Math.round(size / 1024)} KB)`);
    } catch (err) {
      console.log(`FAILED — ${err.message.split('\n')[0]}`);
      failed.push(name);
    }
  }

  await browser.close();

  if (failed.length) {
    console.error(`\n${failed.length} capture(s) failed: ${failed.join(', ')}`);
    process.exitCode = 1;
  }
}

main();
