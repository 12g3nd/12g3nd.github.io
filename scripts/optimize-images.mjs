// Re-encode oversized images in public/, in place.
//
// The asset tree had a 3.8 MB JPEG in it and several PNGs over a megabyte —
// enough that a first visit on a phone was downloading more image bytes than
// the rest of the site combined.
//
// Two rules, both chosen to avoid touching a single reference:
//
//   - Formats and filenames never change. Published transmissions are
//     append-only (see BLOG_ROADMAP.md), so rewriting an .mdx to point at a
//     .webp would be an edit to a published post. Recompressing the bytes
//     behind the same URL is not.
//   - Nothing is upscaled. Each file is capped at the width it actually
//     renders into (see CAPS) times three, so a dense display still has more
//     pixels than it can show.
//
// JPEGs go through mozjpeg; PNGs are quantised to a palette when they survive
// it (the Media illustrations are line art and lose nothing), and left as
// full-colour PNG when they don't. A file is only written back if it actually
// got smaller.
//
// Run it after adding heavy art, then commit the result:
//   node scripts/optimize-images.mjs [--dry]

import sharp from 'sharp';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('public');

/** Only touch files above this — recompressing a 30 KB icon buys nothing. */
const MIN_BYTES = 250 * 1024;

/**
 * Default cap: the prose column is 800px, so 1600 covers it on a 2x display.
 * Applies to blog art, which is the only thing here that goes full width.
 */
const MAX_WIDTH = 1600;

/**
 * Per-file caps for images whose render box is far smaller than the default.
 * Aristotle.jpg is the reason this table exists: a 2290x3250 scan being poured
 * into a 160px-wide container, which is 3.8 MB to draw a thumbnail. Each number
 * is the CSS box from the stylesheet, times three for dense displays.
 */
const CAPS = [
  [/^Aristotle\.jpg$/i, 480], // .quote-image-container — 160px
  [/^Media[/\\]/i, 720], // .media-plate__art img — 68% of a ~350px plate
  [/Preview\.png$|^filter\.png$|^KrineLogo/i, 1000], // project cards — ~380px
  [/^(lightmode)?figure\.(png|jpg)$/i, 1100], // .hero-figure — 550px max
];

function capFor(rel) {
  for (const [pattern, width] of CAPS) if (pattern.test(rel)) return width;
  return MAX_WIDTH;
}

const JPEG_QUALITY = 82;

const dry = process.argv.includes('--dry');

function kb(n) {
  return `${Math.round(n / 1024)} KB`;
}

async function candidates() {
  const out = [];
  for await (const f of glob('**/*.{jpg,jpeg,png,jfif}', { cwd: ROOT })) {
    const abs = path.join(ROOT, f);
    const { size } = await stat(abs);
    if (size >= MIN_BYTES) out.push({ rel: f, abs, size });
  }
  return out.sort((a, b) => b.size - a.size);
}

/** Re-encode one buffer, keeping its format. Returns the best buffer found. */
async function reencode(buf, ext, rel) {
  const img = sharp(buf, { animated: false });
  const meta = await img.metadata();
  const cap = capFor(rel);

  // Only ever shrink.
  const resized =
    meta.width && meta.width > cap
      ? img.resize({ width: cap, withoutEnlargement: true })
      : img;

  if (ext === '.png') {
    // Try a palette first; it is dramatic on flat art and bad on photographs,
    // so keep whichever comes out smaller.
    const [palette, full] = await Promise.all([
      resized.clone().png({ palette: true, quality: 82, effort: 9 }).toBuffer(),
      resized.clone().png({ palette: false, compressionLevel: 9, effort: 10 }).toBuffer(),
    ]);
    return palette.length <= full.length ? palette : full;
  }

  // .jpg / .jpeg / .jfif — all JPEG containers, so mozjpeg applies to each.
  return resized
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true })
    .toBuffer();
}

async function main() {
  const files = await candidates();
  if (!files.length) {
    console.log(`nothing in public/ is over ${kb(MIN_BYTES)}`);
    return;
  }

  let before = 0;
  let after = 0;

  for (const { rel, abs, size } of files) {
    const ext = path.extname(rel).toLowerCase();
    const buf = await readFile(abs);
    let out;
    try {
      out = await reencode(buf, ext, rel);
    } catch (err) {
      console.log(`${rel.padEnd(30)} SKIPPED — ${err.message.split('\n')[0]}`);
      continue;
    }

    before += size;

    if (out.length >= size) {
      after += size;
      console.log(`${rel.padEnd(30)} ${kb(size).padStart(8)}  already minimal`);
      continue;
    }

    after += out.length;
    const saved = Math.round((1 - out.length / size) * 100);
    console.log(
      `${rel.padEnd(30)} ${kb(size).padStart(8)} -> ${kb(out.length).padStart(8)}  -${saved}%${dry ? '  (dry)' : ''}`
    );
    if (!dry) await writeFile(abs, out);
  }

  console.log(
    `\ntotal ${kb(before)} -> ${kb(after)}  (-${Math.round((1 - after / before) * 100)}%)` +
      (dry ? '  [dry run, nothing written]' : '')
  );
}

main();
