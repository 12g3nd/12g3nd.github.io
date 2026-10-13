/* The Equal Earth projection (Šavrič, Patterson & Jenny, 2018).

   Shared by scripts/make-world-map.mjs, which projects the coastlines once and
   commits the result, and the Travel page, which projects every place at
   runtime. Both have to use exactly this math or the dots drift off the land —
   so it lives here, once, and the script imports it directly (Node strips the
   types). Keep it free of anything Node cannot strip: no enums, no namespaces.

   Equal Earth over Mercator because it is equal-area: India is not shrunk
   next to Canada, and the TSJ line's absurd distances read at their true
   proportion. */

const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const M = Math.sqrt(3) / 2;

/** Unscaled projection: radians in, unit-sphere plane coordinates out (y up). */
export function equalEarthRaw(lambda: number, phi: number): [number, number] {
  const l = Math.asin(M * Math.sin(phi));
  const l2 = l * l;
  const l6 = l2 * l2 * l2;
  return [
    (lambda * Math.cos(l)) / (M * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2))),
    l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2)),
  ];
}

/** Scale and offset that place the raw projection in the map's SVG space. */
export type Fit = { k: number; tx: number; ty: number };

const RAD = Math.PI / 180;

/** Longitude/latitude in degrees to SVG coordinates (y down) under `fit`. */
export function project(lng: number, lat: number, fit: Fit): [number, number] {
  const [x, y] = equalEarthRaw(lng * RAD, lat * RAD);
  return [fit.tx + fit.k * x, fit.ty - fit.k * y];
}
