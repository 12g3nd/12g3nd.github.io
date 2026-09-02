// Downloads the webfonts into public/fonts/ and rewrites the @font-face block
// in index.html to point at them.
//
// The site used to load these from fonts.googleapis.com. That cost two extra
// origins and, worse, two serial round trips on a cold load: the browser had to
// fetch and parse Google's stylesheet before it could discover a single woff2.
// Self-hosting collapses that to one — the @font-face rules ship inside the
// HTML, so the font URLs are known before the parser has left the <head>.
//
// It also removes the only network dependency in scripts/visual.mjs. The header
// of that file explains the 35px of drift that a late-arriving face used to
// cause; a same-origin font that is already in dist/ cannot arrive late.
//
// Run this when you change which families or weights the design uses:
//
//   node scripts/fetch-fonts.mjs
//
// It is not part of `npm run build` on purpose. The woff2 files are committed,
// so a build — and CI — never depends on Google being reachable. That is the
// same bargain as scripts/letterboxd.cache.json: a third party being down must
// not change what gets deployed.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// The exact request the old <link> in index.html made. Keep this in sync with
// the FACES list in scripts/visual.mjs — that list is what the screenshot
// harness blocks on, and a face here that is missing there is a silent race.
const GOOGLE_CSS =
  'https://fonts.googleapis.com/css2' +
  '?family=Anton' +
  '&family=Source+Serif+4:ital,wght@0,400;0,600;1,400' +
  '&family=Space+Mono:wght@400;700' +
  '&display=swap';

// Google serves woff2 only to a UA it believes supports it. Ask as Chrome, or
// it hands back ttf and the files are roughly four times the size.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Google splits each face into subsets by script. The site is English with the
// occasional accented borrowing, so latin and latin-ext are the whole need —
// taking cyrillic, greek and vietnamese as well would roughly treble the bytes
// for glyphs no page here renders. unicode-range means a browser that somehow
// does need them simply falls back rather than showing tofu.
const SUBSETS = new Set(['latin', 'latin-ext']);

// The generated region of index.html. Everything between these two markers is
// rewritten wholesale, so do not hand-edit it — edit this script and re-run.
const BEGIN = '<!-- BEGIN generated fonts (scripts/fetch-fonts.mjs) -->';
const END = '<!-- END generated fonts -->';

const OUT_DIR = path.resolve('public', 'fonts');
const INDEX_HTML = path.resolve('index.html');

/**
 * Split the stylesheet into blocks, each tagged with the subset comment that
 * precedes it. Google's output is machine-generated and has been stable for
 * years, but parsing it is still a guess about someone else's format — hence
 * the assertions in main() rather than a silent empty result.
 */
function parseFaces(css) {
  const faces = [];
  const re = /\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;

  for (const [, subset, block] of css.matchAll(re)) {
    const url = block.match(/url\((https:\/\/[^)]+\.woff2)\)/)?.[1];
    if (!url) continue;

    faces.push({
      subset,
      url,
      family: block.match(/font-family:\s*'([^']+)'/)?.[1],
      style: block.match(/font-style:\s*(\w+)/)?.[1] ?? 'normal',
      weight: block.match(/font-weight:\s*(\d+)/)?.[1] ?? '400',
      range: block.match(/unicode-range:\s*([^;]+);/)?.[1],
    });
  }

  return faces;
}

/**
 * A stable, readable filename. Google's own basenames are opaque hashes that
 * change whenever they re-cut the font, which would leave the old file orphaned
 * in public/ with nothing to say it was dead. Encoding the identity instead
 * means a re-run overwrites in place and `git status` shows what actually moved.
 */
function filenameFor(face) {
  const family = face.family.toLowerCase().replace(/\s+/g, '-');
  const style = face.style === 'italic' ? '-italic' : '';
  return `${family}-${face.weight}${style}-${face.subset}.woff2`;
}

async function main() {
  process.stdout.write('fetching font stylesheet ... ');
  const res = await fetch(GOOGLE_CSS, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`stylesheet fetch failed (${res.status})`);
  const css = await res.text();
  console.log('ok');

  const all = parseFaces(css);
  if (!all.length) {
    throw new Error('parsed zero @font-face blocks — Google changed its CSS format');
  }

  const faces = all.filter((f) => SUBSETS.has(f.subset));

  // Every family/weight/style the CSS offered, ignoring which subset it was in.
  // If a face survives the subset filter for none of its variants, the design
  // has silently lost a weight — louder to fail here than to ship it.
  const wanted = new Set(all.map((f) => `${f.family} ${f.weight} ${f.style}`));
  const got = new Set(faces.map((f) => `${f.family} ${f.weight} ${f.style}`));
  for (const face of wanted) {
    if (!got.has(face)) throw new Error(`no latin subset for ${face}`);
  }

  await mkdir(OUT_DIR, { recursive: true });

  let bytes = 0;
  for (const face of faces) {
    const name = filenameFor(face);
    const body = await fetch(face.url, { headers: { 'User-Agent': UA } });
    if (!body.ok) throw new Error(`${name} failed (${body.status})`);

    const buf = Buffer.from(await body.arrayBuffer());
    await writeFile(path.join(OUT_DIR, name), buf);
    bytes += buf.length;
    console.log(`  ${name.padEnd(40)} ${(buf.length / 1024).toFixed(1)} KB`);
  }

  console.log(`\n${faces.length} files, ${(bytes / 1024).toFixed(1)} KB total`);

  // Preload only what the shell paints before any route decides anything: the
  // nav is Space Mono and the wordmark is Anton. Source Serif is reading copy,
  // which is below the fold everywhere it appears and arrives in time on its
  // own — preloading it too would make these two compete for bandwidth and
  // delay the text that is actually on screen.
  const preloadNames = new Set([
    'space-mono-400-latin.woff2',
    'anton-400-latin.woff2',
  ]);

  const preloads = faces
    .map(filenameFor)
    .filter((n) => preloadNames.has(n))
    .map(
      (n) =>
        `    <link rel="preload" href="/fonts/${n}" as="font" type="font/woff2" crossorigin />`,
    );

  if (preloads.length !== preloadNames.size) {
    throw new Error('a preload target was not among the downloaded files');
  }

  const rules = faces.map((face) => {
    const src = `url('/fonts/${filenameFor(face)}') format('woff2')`;
    return [
      '      @font-face {',
      `        font-family: '${face.family}';`,
      `        font-style: ${face.style};`,
      `        font-weight: ${face.weight};`,
      // swap still matters even same-origin: it is what guarantees text paints
      // in a fallback immediately rather than sitting invisible on a slow link.
      '        font-display: swap;',
      `        src: ${src};`,
      `        unicode-range: ${face.range};`,
      '      }',
    ].join('\n');
  });

  const block = [
    BEGIN,
    ...preloads,
    '    <style>',
    ...rules,
    '    </style>',
    `    ${END}`,
  ].join('\n');

  const html = await readFile(INDEX_HTML, 'utf8');
  const region = new RegExp(`${escapeRe(BEGIN)}[\\s\\S]*?${escapeRe(END)}`);
  if (!region.test(html)) {
    throw new Error(`markers not found in index.html — expected ${BEGIN}`);
  }

  await writeFile(INDEX_HTML, html.replace(region, block), 'utf8');
  console.log('rewrote the generated block in index.html');
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

await main();
