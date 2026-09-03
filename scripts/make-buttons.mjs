// The 88x31 buttons -> public/buttons/*.png
//
// Two jobs:
//   1. Rebuild the site's own button at both 88x31 (the canonical size other
//      people hotlink) and 176x62 (the 2x file this site serves via srcset),
//      from new artwork if any has been dropped in and otherwise from the
//      committed 2x PNG — see ARTWORK / FALLBACK below.
//   2. Render the badge set — the "no analytics" / "best viewed with your
//      eyes" strip in the footer — from BADGES below.
//
// Rendered in headless Chromium rather than drawn with sharp because 88x31 is
// a cruel box: the text is 6-7px and only a real text renderer with the site's
// own Space Mono puts it on the pixel grid legibly. Same arrangement as
// capture-og-cards.mjs — run locally, commit the PNGs, so the deploy workflow
// stays `npm ci && vite build` with no browser download in CI.
//
// Every badge here has to be TRUE or obviously a joke. "no analytics" is a
// factual claim about this site (there is no analytics script anywhere in it,
// and the fonts are self-hosted); "best viewed with your eyes" is a gag in the
// Web 1.0 register. What must never appear is a badge that fakes a third
// party's endorsement — a counterfeit W3C validation mark is a lie about
// someone else, not a joke about yourself.
//
// Usage: node scripts/make-buttons.mjs [name ...]   (default: all)

import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, stat, access, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const OUT_DIR = path.resolve('public', 'buttons');
const FONT_DIR = path.resolve('public', 'fonts');

// Where new artwork is dropped to re-import the button. scripts/fixtures/ is
// gitignored (it holds machine-local caches), so this file is NOT in the repo
// and a fresh clone will not have it.
const ARTWORK = path.resolve('scripts', 'fixtures', 'sj-button-source.jpg');

// Which is why the committed 2x PNG is the fallback source, and in every
// ordinary case the real one: it is a lossless copy of that artwork at the
// same 176x62, so regenerating the 1x from it loses nothing the JPEG had. The
// effect is that `public/buttons/` stays reproducible from a clean checkout,
// and ARTWORK is only needed the day the button is redrawn.
const FALLBACK = path.join(OUT_DIR, 'srihith@2x.png');

const W = 88;
const H = 31;

/**
 * The badge set.
 *
 * `top` / `bottom` are the two lines. `href` makes the badge a link in the
 * footer (and is recorded in src/data/buttons.ts, not here). `style` picks one
 * of the four palettes below — mixing them is what stops the row reading as
 * one grey brick, which is exactly how these walls looked.
 *
 * Kept short on purpose. The row is a single line with the site's own button
 * at its centre, so an even number of badges here is what keeps that centre
 * actually central.
 */
const BADGES = [
  { name: 'no-analytics', top: 'NO ANALYTICS', bottom: 'NOBODY IS WATCHING', style: 'ink' },
  { name: 'best-viewed', top: 'BEST VIEWED', bottom: 'WITH YOUR EYES', style: 'warm' },
  { name: 'valid-vibes', top: 'VALID', bottom: 'VIBES ONLY', style: 'green' },
  { name: 'made-in', top: 'MADE IN', bottom: 'CANADA', style: 'red' },
];

/* The palettes. Deliberately high-contrast: at 31px tall, a subtle button is an
   invisible one.

   `red` is the odd one out — it is not from this site's palette at all. #EF3340
   is the Canadian flag red, and the badge is the one here that names a real
   place, so it borrows that place's colours (red field, white type) rather than
   wearing the site's cyan.

   It is also the only style whose two lines are the same colour. Every other
   badge dims its second line to a tint, but white on #EF3340 is already the
   thinnest contrast in the set (about 4:1), and a tint of it measured ~3:1 —
   so the hierarchy here comes from size alone, which is what a two-colour flag
   would do anyway. */
const STYLES = {
  cyan: { bg: '#0A1320', fg: '#00E5FF', sub: '#7fdfff', edge: '#00E5FF' },
  ink: { bg: '#00E5FF', fg: '#0A1320', sub: '#0d2b3a', edge: '#0A1320' },
  warm: { bg: '#1a1206', fg: '#ffb000', sub: '#ffd97a', edge: '#ffb000' },
  green: { bg: '#04140a', fg: '#00ff41', sub: '#9dffb8', edge: '#00ff41' },
  red: { bg: '#EF3340', fg: '#FFFFFF', sub: '#FFFFFF', edge: '#FFFFFF' },
};

function badgeHtml({ top, bottom, style }) {
  const s = STYLES[style];
  return `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  @font-face {
    font-family: 'Space Mono';
    src: url('${pathToFileURL(path.join(FONT_DIR, 'space-mono-700-latin.woff2')).href}') format('woff2');
    font-weight: 700;
    font-display: block;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
  .b {
    width: ${W}px; height: ${H}px;
    background: ${s.bg};
    /* The 1px inset ring is the whole visual grammar of these things. */
    border: 1px solid ${s.edge};
    box-shadow: inset 0 0 0 1px ${s.bg};
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 1px;
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    text-transform: uppercase;
    /* Whole pixels only — a fractional letter position at 7px turns into mud. */
    -webkit-font-smoothing: none;
    text-rendering: geometricPrecision;
  }
  .t { color: ${s.fg}; font-size: 9px; line-height: 10px; letter-spacing: 0.02em; }
  .s { color: ${s.sub}; font-size: 7px; line-height: 8px; letter-spacing: 0.01em; }
  /* Shrink to fit rather than clip: the longest strings here ("nobody is
     watching") do not fit at 7px and must not be guillotined. */
  .t, .s { white-space: nowrap; transform-origin: center; }
</style></head>
<body><div class="b"><div class="t">${top}</div><div class="s">${bottom}</div></div></body></html>`;
}

/** Squeeze a line horizontally until it fits inside the 88px box. */
async function fitLines(page) {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('.t, .s')) {
      const room = 84; // 88 minus the border and a pixel of air either side
      const w = el.scrollWidth;
      if (w > room) el.style.transform = `scaleX(${room / w})`;
    }
  });
}

async function pickSource() {
  for (const [file, label] of [[ARTWORK, 'artwork'], [FALLBACK, 'committed 2x']]) {
    try {
      await access(file);
      return { file, label };
    } catch {
      // Try the next one.
    }
  }
  return null;
}

async function buildOwnButton() {
  const source = await pickSource();
  if (!source) {
    console.log(`skip  own button        (no source: ${path.relative(process.cwd(), ARTWORK)})`);
    return;
  }

  // The artwork is 176x62 — exactly 2x a button, which is why both sizes come
  // out of it cleanly. The 1x file is the one other sites hotlink, so it is the
  // one that has to survive the downscale: Lanczos, then a light sharpen to put
  // back the edge contrast that any resample of 7px type takes away.
  const meta = await sharp(source.file).metadata();

  // Reading and writing the same path in one sharp pipeline truncates the file,
  // so the 2x is buffered before it is written — it is its own source whenever
  // the fallback is in use.
  const twoX = await sharp(source.file)
    .resize(W * 2, H * 2, { fit: 'fill', kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const oneX = await sharp(source.file)
    .resize(W, H, { fit: 'fill', kernel: 'lanczos3' })
    .sharpen({ sigma: 0.6 })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeFile(path.join(OUT_DIR, 'srihith@2x.png'), twoX);
  await writeFile(path.join(OUT_DIR, 'srihith.png'), oneX);
  console.log(
    `own   srihith.png + @2x  (${source.label}, ${meta.width}x${meta.height})`
  );
}

async function main() {
  const only = process.argv.slice(2);
  await mkdir(OUT_DIR, { recursive: true });

  if (!only.length || only.includes('srihith')) await buildOwnButton();

  const badges = only.length ? BADGES.filter((b) => only.includes(b.name)) : BADGES;
  if (!badges.length) {
    if (only.length && !only.includes('srihith')) {
      console.error(`no badges matched. known: ${BADGES.map((b) => b.name).join(', ')}`);
      process.exitCode = 1;
    }
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  for (const badge of badges) {
    const out = path.join(OUT_DIR, `${badge.name}.png`);
    await page.setContent(badgeHtml(badge), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await fitLines(page);
    await page.screenshot({ path: out, type: 'png' });
    const { size } = await stat(out);
    console.log(`badge ${badge.name.padEnd(16)} ok (${size} B)`);
  }

  await browser.close();
}

main();
