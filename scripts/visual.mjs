// Pixel-identical guard for the refactor.
//
// Captures every route, in both themes, at three widths, and diffs the result
// against a stored baseline. The contract this enforces is "the refactor changed
// no pixels" — so the capture has to be repeatable to the pixel, and this site
// is not naturally repeatable at all. The determinism work below is the whole
// point of the script; the screenshotting is the easy part.
//
// What moves on its own, and how it is pinned:
//   - clock       LogClock ticks, isLateNight() and age() read the date, and the
//                 nav phrase list rotates. page.clock freezes time before any
//                 script runs, so all four render the same on every pass.
//   - randomness  AsciiRipple seeds itself from Math.random. Replaced with a
//                 seeded LCG in an init script, so the ripple is the same ripple.
//   - guestbook   /guestbook and the Home preview fetch live from the Worker,
//                 and the entry list grows. Served from a local cache instead.
//                 This also stops the harness POSTing /visit and moving the
//                 real counter, and makes /guestbook work offline.
//   - spotify     A third-party iframe on /media. Nothing can make it stable, so
//                 it is replaced by a blank frame of identical dimensions —
//                 the surrounding layout is what this script is here to check.
//   - motion      reducedMotion: 'reduce' skips the boot sequence, forces every
//                 Reveal block visible and keeps the easter eggs from firing.
//                 See capture-pdf.mjs, which relies on the same lever.
//
// Point this at a preview server, never at `npm run dev`.
//
// The dev server transforms modules and re-optimises dependencies on demand, so
// the first N page loads of a run render measurably differently from the ones
// after it. That showed up as a contiguous prefix of every run differing by one
// 35px row, and it survived both pinned storage and a browser context per shot,
// because the varying thing was the server rather than the page. A built site is
// static, and it is also what actually deploys.
//
// Usage:
//   npm run build && npx vite preview --port 4173
//   node scripts/visual.mjs baseline [baseURL]   # store the reference set
//   node scripts/visual.mjs check    [baseURL]   # capture again and diff
//
// Rebuild before each check, or the check photographs the previous build.
//
// Both write PNGs under scripts/visual/, which is gitignored.

import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const MODE = process.argv[2] || 'check';
const BASE = process.argv[3] || 'http://localhost:4173';

const ROOT = path.resolve('scripts', 'visual');
const BASELINE_DIR = path.join(ROOT, 'baseline');
const CURRENT_DIR = path.join(ROOT, 'current');
const DIFF_DIR = path.join(ROOT, 'diff');
const FIXTURE = path.resolve('scripts', 'fixtures', 'guestbook.json');

const WORKER = 'https://guestbook.jarabana.com';

// Frozen wall clock. A fixed instant in the afternoon, deliberately outside the
// 1-5am window isLateNight() checks, so the nav shows its ordinary phrase set.
const FIXED_TIME = new Date('2026-03-15T15:30:00Z');

// In nav order, then the transmissions, then the 404 page — the same ordering
// capture-pdf.mjs uses. All five posts are here, not the two that script spot
// checks, because BlogPost.css is one of the stylesheets being split.
const ROUTES = [
  { route: '/', name: '01-home' },
  { route: '/projects', name: '02-projects' },
  { route: '/business', name: '03-business' },
  { route: '/poetry', name: '04-poetry' },
  { route: '/media', name: '05-media' },
  { route: '/blog', name: '06-blog' },
  { route: '/blog/whats-a-god-to-a-non-believer', name: '07-post-god' },
  { route: '/blog/performative', name: '08-post-performative' },
  { route: '/blog/doesnt-have-to-be-from-anywhere', name: '09-post-anywhere' },
  { route: '/blog/wanting-things', name: '10-post-wanting' },
  { route: '/blog/brutalist-y2k', name: '11-post-y2k' },
  { route: '/guestbook', name: '12-guestbook' },
  { route: '/this-page-does-not-exist', name: '13-not-found' },
];

// Chosen to straddle the breakpoints the CSS actually declares (480, 600, 768,
// 900, 1179), so each width lands in a different branch of the responsive rules.
const WIDTHS = [390, 820, 1440];

const THEMES = ['dark', 'light'];

/**
 * Injected into every page after load, and never shipped.
 *
 * CSS animations run on the compositor, not on JS timers, so the paused clock
 * does not touch them — the terminal caret kept blinking, and each shot caught
 * it lit or unlit at random. That was the last source of drift: one 8x14 glyph,
 * exactly 112 pixels, on whichever routes happened to catch it mid-blink.
 *
 * Holding every animation and transition at its first frame makes the caret
 * deterministic. The trade is real and worth stating: an element whose final
 * appearance is produced *by* an animation is photographed in its starting
 * state. Nothing on this site depends on that — the reveal-on-scroll blocks are
 * handled by reducedMotion, and framer-motion writes inline styles rather than
 * keyframes — but a future animation that does would be captured unverified.
 */
const FREEZE_CSS = `*, *::before, *::after {
  animation: none !important;
  transition: none !important;
  caret-color: transparent !important;
}`;

/** Fetch the guestbook once and cache it. Gitignored: it is 44 real signatures. */
async function loadFixture() {
  if (existsSync(FIXTURE)) return readFile(FIXTURE, 'utf8');
  process.stdout.write('fetching guestbook fixture ... ');
  const res = await fetch(`${WORKER}/entries?approved=1`);
  if (!res.ok) throw new Error(`fixture fetch failed (${res.status})`);
  const body = await res.text();
  await mkdir(path.dirname(FIXTURE), { recursive: true });
  await writeFile(FIXTURE, body);
  process.stdout.write('ok\n');
  return body;
}

/**
 * Runs before any page script. Pins Math.random, the theme, and every piece of
 * stored state the site keys behaviour off.
 *
 * The stored state matters more than it looks. Each shot now gets its own
 * context, but the site writes to localStorage as it runs, and anything written
 * before the shutter opens changes what is photographed. The nudge hint was
 * exactly that: Navigation.tsx starts it on for a first-time visitor and a 12s
 * timer turns it off and records that in localStorage — which, back when one
 * context walked all thirteen routes, silently shortened every page captured
 * after it fired, for 35px of drift that moved between runs.
 *
 * Everything is therefore pinned to the returning-visitor state, which is what
 * twelve of the thirteen routes settle into anyway. The cost, stated plainly:
 * the first-visit nudge text and the boot sequence are never photographed, so
 * the refactor is not verified against them.
 */
function initScript({ theme }) {
  // Seeded LCG (Numerical Recipes constants). Deterministic across runs, and
  // still well distributed enough that AsciiRipple looks like itself.
  let seed = 0x2545f491;
  Math.random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  try {
    localStorage.setItem('sjsys_theme', theme);
    localStorage.setItem('sjsys_terminal_seen', '1');
    localStorage.removeItem('sjsys_resume_unlocked');
    sessionStorage.setItem('sjsys_booted', '1');
    sessionStorage.setItem('sjsys_counted', '1');
  } catch {
    // Storage denied: the class below still carries the theme for this page.
  }
  if (theme === 'light') document.documentElement.classList.add('theme-light');
}

/**
 * Every face the design depends on, in the weights and styles index.html asks
 * Google Fonts for. Listed explicitly because document.fonts.ready is not enough
 * on its own: the stylesheet is loaded with display=swap, so the page paints in
 * fallback metrics and reflows when the real face lands, and `ready` can resolve
 * before that has happened. Text set in a fallback is a different width, which
 * decided whether the nav phrase wrapped to a second line — the 35px of height
 * that kept moving between runs.
 */
const FACES = [
  '400 16px "Space Mono"',
  '700 16px "Space Mono"',
  '400 16px Anton',
  '400 16px "Source Serif 4"',
  '600 16px "Source Serif 4"',
  'italic 400 16px "Source Serif 4"',
];

/**
 * Block until every face is genuinely applied, or fail loudly.
 *
 * The fonts come off the network, so this is the one place a capture depends on
 * something outside the machine. Waiting makes the outcome deterministic even
 * when the network is slow; throwing makes a font that never arrives an obvious
 * error rather than a silent 35px of drift.
 */
async function ensureFonts(page) {
  await page.evaluate(async (faces) => {
    await Promise.all(faces.map((f) => document.fonts.load(f)));
    await document.fonts.ready;
  }, FACES);

  const missing = await page.evaluate(
    (faces) => faces.filter((f) => !document.fonts.check(f)),
    FACES,
  );
  if (missing.length) {
    throw new Error(`fonts never applied: ${missing.join(', ')} — capture would be racy`);
  }
}

/**
 * Wait for the page to reach its settled state, rather than for a fixed delay.
 *
 * The one element that resolves asynchronously on every page is the visit
 * counter: it renders six dashes until its fetch lands, then six digits. A
 * fixed wait photographs whichever the race happened to produce, so this polls
 * for the resolved form instead.
 *
 * The polling runs from Node, not from the page. page.waitForFunction would
 * schedule its own polling with in-page timers, and those are frozen by the
 * paused clock — it would wait forever.
 */
async function settle(page) {
  for (let i = 0; i < 40; i += 1) {
    const done = await page.evaluate(() => {
      const el = document.querySelector('.visitor-counter__value');
      return !el || !el.textContent.includes('-');
    });
    if (done) break;
    await page.waitForTimeout(250);
  }

  // Then wait for the layout itself to stop moving.
  //
  // document.fonts.check() reports a face as loaded, not as laid out, so a
  // shot could still be taken between the face arriving and the reflow that
  // uses its metrics. That reflow changed where the nav wrapped, which is the
  // 35px that kept appearing in the first shots of a run and not the later
  // ones. Height stable across two reads means the page has finished moving,
  // whatever the cause.
  let last = -1;
  for (let i = 0; i < 20; i += 1) {
    const h = await page.evaluate(() => document.body.scrollHeight);
    if (h === last) return;
    last = h;
    await page.waitForTimeout(200);
  }
}

/**
 * Load every route once before capturing anything.
 *
 * Vite transforms modules on first request, so a cold dev server serves the
 * first run measurably slower than the second. That timing difference is enough
 * to change what has finished rendering when the shutter opens, which showed up
 * as drift between two captures of identical code.
 */
async function warmUp(browser) {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  // Stubbed here too, so the claim at the top of this file holds without
  // exception: no part of a capture run reaches the real Worker.
  await context.route(`${WORKER}/**`, (route) =>
    route.fulfill({ contentType: 'application/json', body: '{"entries":[],"count":1}' }),
  );
  const page = await context.newPage();
  for (const { route } of ROUTES) {
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  }
  await context.close();
}

async function capture(outDir, fixture) {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  await warmUp(browser);
  let shots = 0;
  const metrics = {};

  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      for (const { route, name } of ROUTES) {
      // A context per shot, not per theme/width.
      //
      // Sharing one context across the thirteen routes meant each capture
      // inherited whatever the previous twelve had left behind, and a cold first
      // load rendered measurably differently from a warm one. The symptom was
      // always the same shape: a contiguous prefix of the run differed by one
      // 35px row, and the boundary moved between runs. Pinning stored state
      // fixed part of it; isolating each shot removes the whole class, at the
      // cost of a browser context per route.
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
      });

      await context.addInitScript(initScript, { theme });

      // Every Worker call: the entry list, and both counter endpoints. Answering
      // them here means nothing in this run can reach the real Worker.
      await context.route(`${WORKER}/**`, (route) => {
        const url = route.request().url();
        if (url.includes('/entries')) {
          return route.fulfill({ contentType: 'application/json', body: fixture });
        }
        return route.fulfill({ contentType: 'application/json', body: '{"count":1234}' });
      });

      // The one thing that cannot be frozen. Same box, no content.
      await context.route('https://open.spotify.com/**', (route) =>
        route.fulfill({ contentType: 'text/html', body: '<!doctype html><body></body>' }),
      );

      const page = await context.newPage();
      // install() alone leaves the clock ticking, which lets the nav typewriter
      // advance by a timing-dependent number of characters. At 390 and 820 a
      // longer phrase wraps to a second line, so the whole page grew by exactly
      // one line height between runs. pauseAt stops it dead: the phrase is
      // always caught at the same character.
      await page.clock.install({ time: FIXED_TIME });
      await page.clock.pauseAt(FIXED_TIME);

      // Loaded twice, photographed on the second. The first load pays for
      // whatever is cold — module transforms, font files, images — so the shot
      // is always taken from the same warm state.
      await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 });
      await ensureFonts(page);
      await page.reload({ waitUntil: 'networkidle', timeout: 30000 });

      await page.addStyleTag({ content: FREEZE_CSS });
      await ensureFonts(page);
      await settle(page);
      const shotName = `${name}--${theme}--${width}`;
      await page.screenshot({
        fullPage: true,
        path: path.join(outDir, `${shotName}.png`),
      });

      // Recorded alongside the image so a drift can be read as "this element
      // changed height" instead of being reverse-engineered from pixels. A
      // screenshot says something moved; this says what.
      metrics[shotName] = await page.evaluate(() => {
        const h = (sel) => {
          const el = document.querySelector(sel);
          return el ? Math.round(el.getBoundingClientRect().height) : null;
        };
        const row = document.querySelector('.terminal-mobile-row');
        return {
          body: document.body.scrollHeight,
          nav: h('.brutalist-nav'),
          navLinks: h('.nav-links'),
          mobileRow: h('.terminal-mobile-row'),
          headerBox: h('.terminal-header-box'),
          brand: h('.nav-brand'),
          rowText: row ? row.textContent.trim().slice(0, 48) : null,
        };
      });
      shots += 1;
      process.stdout.write(`\r  ${shots} shots`);

      await context.close();
      }
    }
  }

  await browser.close();
  await writeFile(path.join(outDir, 'metrics.json'), JSON.stringify(metrics, null, 1));
  process.stdout.write(`\r  ${shots} shots captured\n`);
}

/** Raw-pixel compare. Returns null when identical, else a description + diff PNG. */
async function diffPair(name) {
  const a = sharp(path.join(BASELINE_DIR, name));
  const b = sharp(path.join(CURRENT_DIR, name));
  const [ma, mb] = [await a.metadata(), await b.metadata()];

  if (ma.width !== mb.width || ma.height !== mb.height) {
    return `size ${ma.width}x${ma.height} -> ${mb.width}x${mb.height}`;
  }

  const [ra, rb] = await Promise.all([
    a.raw().toBuffer(),
    b.raw().toBuffer(),
  ]);

  // Channel count is whatever sharp decoded; compare per pixel, not per byte, so
  // the diff image can mark the whole pixel rather than one channel of it.
  const channels = ra.length / (ma.width * ma.height);
  const mask = Buffer.alloc(ma.width * ma.height * 3);
  let changed = 0;

  for (let p = 0; p < ma.width * ma.height; p += 1) {
    let same = true;
    for (let c = 0; c < channels; c += 1) {
      if (ra[p * channels + c] !== rb[p * channels + c]) {
        same = false;
        break;
      }
    }
    if (same) {
      // Keep an unchanged pixel as a dimmed greyscale ghost for context.
      const grey = 60 + Math.round((ra[p * channels] / 255) * 40);
      mask[p * 3] = grey;
      mask[p * 3 + 1] = grey;
      mask[p * 3 + 2] = grey;
    } else {
      changed += 1;
      mask[p * 3] = 255;
      mask[p * 3 + 1] = 0;
      mask[p * 3 + 2] = 128;
    }
  }

  if (changed === 0) return null;

  await mkdir(DIFF_DIR, { recursive: true });
  await sharp(mask, { raw: { width: ma.width, height: ma.height, channels: 3 } })
    .png()
    .toFile(path.join(DIFF_DIR, name));

  const pct = ((changed / (ma.width * ma.height)) * 100).toFixed(3);
  return `${changed} px (${pct}%)`;
}

async function main() {
  const fixture = await loadFixture();

  if (MODE === 'baseline') {
    console.log(`baseline -> ${BASELINE_DIR}`);
    await capture(BASELINE_DIR, fixture);
    console.log('baseline stored.');
    return;
  }

  if (!existsSync(BASELINE_DIR)) {
    throw new Error('no baseline: run `node scripts/visual.mjs baseline` first');
  }

  console.log(`check -> ${CURRENT_DIR}`);
  await rm(DIFF_DIR, { recursive: true, force: true });
  await capture(CURRENT_DIR, fixture);

  const names = (await readdir(BASELINE_DIR)).filter((f) => f.endsWith('.png'));

  // An empty or short baseline must never read as a pass. Comparing nothing
  // against nothing found "zero differing pixels" once, which is exactly the
  // kind of green this script exists to not produce.
  const expected = ROUTES.length * THEMES.length * WIDTHS.length;
  if (names.length !== expected) {
    throw new Error(`baseline has ${names.length} shots, expected ${expected} — re-run baseline`);
  }

  const failures = [];

  for (const name of names) {
    if (!existsSync(path.join(CURRENT_DIR, name))) {
      failures.push([name, 'missing from this run']);
      continue;
    }
    const result = await diffPair(name);
    if (result) failures.push([name, result]);
  }

  if (failures.length === 0) {
    console.log(`\nIDENTICAL — ${names.length} shots, zero differing pixels.`);
    return;
  }

  console.log(`\nDRIFT — ${failures.length} of ${names.length} shots differ:\n`);
  for (const [name, why] of failures) console.log(`  ${name}  ${why}`);
  // Only same-size pairs produce a diff image, so do not advertise a directory
  // that a run of pure size mismatches never created.
  if (existsSync(DIFF_DIR)) console.log(`\ndiff images in ${DIFF_DIR}`);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
