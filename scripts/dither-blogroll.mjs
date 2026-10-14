// Turns the blogroll photos into ordered-dither pixel portraits.
//
// Three inks per friend (navy, their nav line colour, and cream), with a 4x4
// Bayer matrix choosing between the two nearest inks at each pixel. Drawn at
// 64px and scaled up 2x with nearest-neighbour, so the pixels stay crisp at
// the 52px the blogroll shows them at on a dense screen.
//
// The originals are not in the repo (scripts/fixtures/ is gitignored).
//   node scripts/dither-blogroll.mjs

import sharp from 'sharp';

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const NAVY = [10, 19, 32];
const CREAM = [253, 246, 227];
const N = 64;

const JOBS = [
  // source, output, square crop (left, top, size), line colour, gamma
  { src: 'scripts/fixtures/blogroll-skyler.png', out: 'public/blogroll/skyler-xiao.png', crop: [110, 90, 450], line: [168, 113, 63], gamma: 1.0 },
  { src: 'scripts/fixtures/blogroll-aryan.webp', out: 'public/blogroll/aryan-thakur.png', crop: [180, 40, 480], line: [255, 95, 162], gamma: 0.85 },
];

for (const { src, out, crop: [left, top, size], line, gamma } of JOBS) {
  const { data } = await sharp(src)
    .extract({ left, top, width: size, height: size })
    .resize(N, N)
    .greyscale()
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const inks = [NAVY, line, CREAM];
  const px = Buffer.alloc(N * N * 3);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const v = Math.pow(data[y * N + x] / 255, gamma) * (inks.length - 1);
      const lo = Math.min(Math.floor(v), inks.length - 2);
      const ink = v - lo > (BAYER[y % 4][x % 4] + 0.5) / 16 ? inks[lo + 1] : inks[lo];
      px.set(ink, (y * N + x) * 3);
    }
  }
  await sharp(px, { raw: { width: N, height: N, channels: 3 } })
    .resize(N * 2, N * 2, { kernel: 'nearest' })
    .png({ palette: true })
    .toFile(out);
  console.log(out);
}
