// Full-length screenshot of every page → single combined PDF.
//
// Launches the running Vite dev server in headless Chromium with
// reduced-motion forced on. That one lever does a lot of work for this site:
//   - skips the boot sequence (App.tsx bails on prefers-reduced-motion)
//   - renders every scroll-revealed block fully visible (Reveal.tsx)
//   - keeps the matrix / CRT / party easter eggs from firing
// PageTransition still fades regardless, so we wait it out before each shot.
//
// Usage: node scripts/capture-pdf.mjs [baseURL] [outFile]

import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.argv[2] || 'http://localhost:5173';
const OUT = process.argv[3] || path.resolve('SJ.SYS-portfolio.pdf');
const SHOTS_DIR = path.resolve('scripts', 'shots');

const VIEWPORT_WIDTH = 1280;
const SCALE = 2; // device pixels per CSS px → crisp text in the PDF
const MAX_PT = 14000; // keep each PDF page under the ~200in viewer limit

// In nav order, then blog posts, then the 404 page last.
const PAGES = [
  { route: '/', name: '01-home' },
  { route: '/projects', name: '02-projects' },
  { route: '/business', name: '03-business' },
  { route: '/poetry', name: '04-poetry' },
  { route: '/media', name: '05-media' },
  { route: '/blog', name: '06-blog' },
  { route: '/blog/brutalist-y2k', name: '07-blog-brutalist-y2k' },
  { route: '/blog/wanting-things', name: '08-blog-wanting-things' },
  { route: '/guestbook', name: '09-guestbook' },
  { route: '/this-page-does-not-exist', name: '10-not-found' },
];

async function main() {
  await mkdir(SHOTS_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: VIEWPORT_WIDTH, height: 900 },
    deviceScaleFactor: SCALE,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();

  const pdf = await PDFDocument.create();
  const shots = [];

  for (const { route, name } of PAGES) {
    const url = BASE + route;
    process.stdout.write(`capturing ${route} ... `);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    // Fonts in, then let the 0.3s PageTransition fade finish.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(700);

    const file = path.join(SHOTS_DIR, `${name}.png`);
    const buf = await page.screenshot({ fullPage: true, path: file });
    shots.push(file);

    // Embed at native pixel size, then map device px → PDF points (1 CSS px = 1pt),
    // scaling the whole page down if it would exceed the viewer height limit.
    const img = await pdf.embedPng(buf);
    let w = img.width / SCALE;
    let h = img.height / SCALE;
    if (h > MAX_PT) {
      const f = MAX_PT / h;
      w *= f;
      h *= f;
    }
    const p = pdf.addPage([w, h]);
    p.drawImage(img, { x: 0, y: 0, width: w, height: h });
    process.stdout.write(`ok (${img.width}x${img.height}px)\n`);
  }

  await browser.close();

  const bytes = await pdf.save();
  await writeFile(OUT, bytes);
  console.log(`\nwrote ${PAGES.length} pages → ${OUT}`);
  console.log(`individual screenshots in ${SHOTS_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
