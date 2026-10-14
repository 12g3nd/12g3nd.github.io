import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import PageTransition from '../components/PageTransition';
import StationHeader from '../components/StationHeader';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { routeMeta } from '../data/routeMeta';
import {
  homes,
  regions,
  stationCode,
  stations,
  TERMINUS_ID,
  visits,
  type Home,
  type RegionId,
  type Station,
  type Visit,
} from '../data/travel';
import { project, type Fit } from '../utils/equalEarth';
import './Travel.css';

/* The world map lives in its own chunk (~110 KB of coastline) and arrives when
   this page mounts, so nobody pays for it on any other route. */
type World = { width: number; height: number; fit: Fit; land: string };
let worldCache: World | null = null;
const loadWorld = () =>
  import('../data/worldMap').then((m) => {
    worldCache = { width: m.WORLD_WIDTH, height: m.WORLD_HEIGHT, fit: m.WORLD_FIT, land: m.WORLD_LAND };
    return worldCache;
  });

type Kind = 'tsj' | 'visit' | 'home';
type Item =
  | { kind: 'tsj'; place: Station }
  | { kind: 'visit'; place: Visit }
  | { kind: 'home'; place: Home };
type ViewBox = { x: number; y: number; w: number; h: number };

const KIND_LABEL: Record<Kind, string> = { tsj: 'TSJ', visit: 'NON-TSJ', home: 'LIVED' };

const allItems: Item[] = [
  ...stations.map((place) => ({ kind: 'tsj' as const, place })),
  ...homes.map((place) => ({ kind: 'home' as const, place })),
  ...visits.map((place) => ({ kind: 'visit' as const, place })),
];
const countryCount = new Set(allItems.map((i) => i.place.country)).size;
const terminus = homes.find((h) => h.id === TERMINUS_ID)!;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The smallest preset view that contains a point, so selecting zooms sensibly. */
function regionFor(lat: number, lng: number): RegionId {
  const order: RegionId[] = ['gta', 'ontario-quebec', 'india', 'europe', 'north-america'];
  for (const id of order) {
    const r = regions.find((x) => x.id === id)!;
    if (r.box && lng >= r.box.west && lng <= r.box.east && lat >= r.box.south && lat <= r.box.north) return id;
  }
  return 'world';
}

/** Entries each list group shows before its "+ N more". */
const LIST_LIMIT = 5;

/** The list group a place is filed under, so selecting it can open that group. */
const groupOf = (item: Item) => (item.kind === 'visit' ? `visit:${item.place.country}` : item.kind);

/** Fit a lng/lat box into a viewBox with the map's own aspect, padded. */
function viewBoxFor(id: RegionId, world: World): ViewBox {
  const region = regions.find((r) => r.id === id)!;
  if (!region.box) return { x: 0, y: 0, w: world.width, h: world.height };
  const { west, east, south, north } = region.box;
  // Sample the box's edges: under Equal Earth the parallels bow, so the
  // corners alone can miss the widest point.
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i <= 8; i++) {
    const lng = west + ((east - west) * i) / 8;
    const lat = south + ((north - south) * i) / 8;
    for (const [px, py] of [project(lng, south, world.fit), project(lng, north, world.fit), project(west, lat, world.fit), project(east, lat, world.fit)]) {
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    }
  }
  const aspect = world.width / world.height;
  let w = x1 - x0;
  let h = y1 - y0;
  if (w / h > aspect) h = w / aspect;
  else w = h * aspect;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/**
 * A leg of the line drawn the way a transit diagram draws it: only
 * horizontals, verticals and 45° diagonals, with the straight run first unless
 * `diagonalFirst`. (A→B straight-first and B→A diagonal-first are the same
 * path; B→A straight-first is the other elbow.)
 */
function octilinear(a: [number, number], b: [number, number], diagonalFirst: boolean) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.min(Math.abs(dx), Math.abs(dy));
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  const straight: [number, number] =
    Math.abs(dx) >= Math.abs(dy) ? [sx * (Math.abs(dx) - d), 0] : [0, sy * (Math.abs(dy) - d)];
  const diagonal: [number, number] = [sx * d, sy * d];
  const first = diagonalFirst ? diagonal : straight;
  const mid: [number, number] = [a[0] + first[0], a[1] + first[1]];
  return `M${a[0]} ${a[1]}L${mid[0]} ${mid[1]}L${b[0]} ${b[1]}`;
}

type LabelSpot = { x: number; y: number; anchor: 'start' | 'middle' | 'end' };

/** Where a label may sit relative to its dot, in screen pixels, most preferred first. */
const SPOTS: LabelSpot[] = [
  { x: 10, y: -7, anchor: 'start' },
  { x: 10, y: 15, anchor: 'start' },
  { x: -10, y: -7, anchor: 'end' },
  { x: -10, y: 15, anchor: 'end' },
  { x: 0, y: -13, anchor: 'middle' },
  { x: 0, y: 22, anchor: 'middle' },
];
const LABEL_PX = 11;
/** Space Mono is monospaced: every glyph is ~0.62em wide at bold weight. */
const labelWidth = (text: string) => text.length * LABEL_PX * 0.62;

/**
 * Greedy label placement. Labels are placed in priority order, each taking the
 * first spot around its dot that does not overlap one already placed; a label
 * that fits nowhere is dropped, unless it is one that must always show (a
 * station, the terminus, or whatever is selected or hovered). Works in screen
 * pixels via `u`, so the result holds at every zoom.
 */
function placeLabels(
  wanted: { id: string; text: string; at: [number, number]; must: boolean }[],
  u: number,
): Map<string, LabelSpot> {
  const placed: { x0: number; y0: number; x1: number; y1: number }[] = [];
  const out = new Map<string, LabelSpot>();
  for (const w of wanted) {
    const wPx = labelWidth(w.text);
    let chosen: LabelSpot | null = null;
    let box = null;
    for (const spot of SPOTS) {
      const left = spot.anchor === 'start' ? spot.x : spot.anchor === 'end' ? spot.x - wPx : spot.x - wPx / 2;
      const b = {
        x0: w.at[0] / u + left - 2,
        y0: w.at[1] / u + spot.y - LABEL_PX,
        x1: w.at[0] / u + left + wPx + 2,
        y1: w.at[1] / u + spot.y + 3,
      };
      if (!placed.some((p) => b.x0 < p.x1 && b.x1 > p.x0 && b.y0 < p.y1 && b.y1 > p.y0)) {
        chosen = spot;
        box = b;
        break;
      }
    }
    if (!chosen && w.must) {
      chosen = SPOTS[0];
      const b0 = { x0: w.at[0] / u + 8, y0: w.at[1] / u - 7 - LABEL_PX, x1: w.at[0] / u + 12 + wPx, y1: w.at[1] / u - 4 };
      box = b0;
    }
    if (chosen && box) {
      placed.push(box);
      out.set(w.id, chosen);
    }
  }
  return out;
}

export default function Travel() {
  useDocumentMeta(routeMeta.travel.title, routeMeta.travel.description);

  const [world, setWorld] = useState<World | null>(worldCache);
  const [shown, setShown] = useState<Record<Kind, boolean>>({ tsj: true, visit: true, home: true });
  // null once the visitor has zoomed or panned by hand: no preset is current.
  const [region, setRegion] = useState<RegionId | null>('world');
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  // List groups opened past their first LIST_LIMIT entries.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [vb, setVb] = useState<ViewBox | null>(null);
  const [pxWidth, setPxWidth] = useState(1000);
  const svgRef = useRef<SVGSVGElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const vbRef = useRef<ViewBox | null>(null);

  useEffect(() => {
    if (world) return;
    let live = true;
    loadWorld().then((w) => { if (live) setWorld(w); });
    return () => { live = false; };
  }, [world]);

  // Markers and labels are sized in screen pixels, not map units, so they stay
  // the same size whether the view is the whole world or the GTA.
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const ro = new ResizeObserver(([e]) => setPxWidth(e.contentRect.width || 1000));
    ro.observe(svg);
    return () => ro.disconnect();
  }, [world]);

  // Move to the region's view: tweened, unless reduced motion asks otherwise.
  useEffect(() => {
    if (!world || region === null) return;
    const target = viewBoxFor(region, world);
    const from = vbRef.current;
    let frame = 0;
    // First view, or reduced motion: no tween, just land there next frame.
    if (!from || prefersReducedMotion()) {
      frame = requestAnimationFrame(() => {
        vbRef.current = target;
        setVb(target);
      });
      return () => cancelAnimationFrame(frame);
    }
    const start = performance.now();
    const DURATION = 550;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const e = ease(t);
      const next = {
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e,
        w: from.w + (target.w - from.w) * e,
        h: from.h + (target.h - from.h) * e,
      };
      vbRef.current = next;
      setVb(next);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [region, world]);

  // ── Zoom and pan by hand ───────────────────────────────────
  // Mouse: drag to pan, ctrl/⌘ + wheel (which is also what a trackpad pinch
  // sends) to zoom about the cursor. Touch: two fingers pinch and move the map;
  // one finger is left to the browser so the page still scrolls past the map
  // (touch-action: pan-x pan-y in Travel.css). The +, − and reset buttons do
  // the same for anyone using a keyboard.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ moved: false, travel: 0, dist: 0, mid: { x: 0, y: 0 } });

  const setView = (next: ViewBox) => {
    if (!world) return;
    const w = Math.min(world.width, Math.max(world.width / 48, next.w));
    const h = w * (world.height / world.width);
    // Zoom about the centre the caller asked for, then keep the view on the map.
    const cx = next.x + next.w / 2;
    const cy = next.y + next.h / 2;
    const x = Math.min(world.width - w, Math.max(0, cx - w / 2));
    const y = Math.min(world.height - h, Math.max(0, cy - h / 2));
    const v = { x, y, w, h };
    vbRef.current = v;
    setVb(v);
    setRegion(null);
  };

  /** Zoom by `factor` keeping the map point under (ax, ay) — px in the svg box — still. */
  const zoomAt = (factor: number, ax: number, ay: number, box: DOMRect) => {
    const cur = vbRef.current;
    if (!cur) return;
    const fx = ax / box.width;
    const fy = ay / box.height;
    const w = cur.w / factor;
    const h = cur.h / factor;
    setView({ x: cur.x + fx * cur.w - fx * w, y: cur.y + fy * cur.h - fy * h, w, h });
  };

  const panBy = (dxPx: number, dyPx: number, box: DOMRect) => {
    const cur = vbRef.current;
    if (!cur) return;
    setView({ ...cur, x: cur.x - (dxPx * cur.w) / box.width, y: cur.y - (dyPx * cur.h) / box.height });
  };

  const zoomButton = (factor: number) => {
    const box = svgRef.current?.getBoundingClientRect();
    if (box) zoomAt(factor, box.width / 2, box.height / 2, box);
  };

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) gesture.current = { moved: false, travel: 0, dist: 0, mid: { x: 0, y: 0 } };
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current.dist = Math.hypot(a.x - b.x, a.y - b.y);
      gesture.current.mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const last = pointers.current.get(e.pointerId);
    if (!last) return;
    const box = e.currentTarget.getBoundingClientRect();
    const now = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, now);

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const g = gesture.current;
      if (g.dist > 0) {
        zoomAt(dist / g.dist, mid.x - box.left, mid.y - box.top, box);
        panBy(mid.x - g.mid.x, mid.y - g.mid.y, box);
      }
      g.dist = dist;
      g.mid = mid;
      g.moved = true;
      return;
    }

    // One mouse pointer with the button held: drag to pan, once it has moved
    // far enough not to be a click.
    if (e.pointerType === 'mouse' && e.buttons & 1) {
      const g = gesture.current;
      g.travel += Math.hypot(now.x - last.x, now.y - last.y);
      if (g.travel > 4) {
        if (!g.moved) e.currentTarget.setPointerCapture(e.pointerId);
        g.moved = true;
        panBy(now.x - last.x, now.y - last.y, box);
      }
    }
  };

  const onPointerEnd = (e: ReactPointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    gesture.current.dist = 0;
    if (pointers.current.size === 1) {
      // Pinch became one finger: restart from it, so the next move is not a jump.
      const [a] = [...pointers.current.values()];
      gesture.current.mid = a;
    }
  };

  // The wheel handler has to be non-passive to stop the page zooming or
  // scrolling, which React's onWheel cannot be. Without ctrl/⌘ the wheel is
  // left alone, so scrolling past the map still scrolls the page.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const box = svg.getBoundingClientRect();
      const factor = Math.exp(-Math.max(-50, Math.min(50, e.deltaY)) * 0.01);
      zoomAt(factor, e.clientX - box.left, e.clientY - box.top, box);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  });

  const points = useMemo(() => {
    if (!world) return new Map<string, [number, number]>();
    return new Map(allItems.map((i) => [i.place.id, project(i.place.lng, i.place.lat, world.fit)]));
  }, [world]);

  const line = useMemo(() => {
    if (!world || !stations.length) return null;
    const stops = [terminus, ...stations].map((p) => points.get(p.id)!);
    const out = stops.slice(0, -1).map((a, i) => octilinear(a, stops[i + 1], false)).join('');
    // Straight-first from the far end takes the opposite elbow to the way out,
    // so the return closes a loop instead of tracing over the outbound leg.
    const back = octilinear(stops[stops.length - 1], stops[0], false);
    return { out, back };
  }, [points, world]);

  const visible = allItems.filter((i) => shown[i.kind]);
  const selectedItem = allItems.find((i) => i.place.id === selected) ?? null;

  const select = (item: Item, fromList = false) => {
    if (!fromList && gesture.current.moved) return; // the end of a drag, not a click
    setSelected(item.place.id);
    setExpanded((prev) => new Set(prev).add(groupOf(item)));
    if (fromList) {
      setRegion(regionFor(item.place.lat, item.place.lng));
      mapRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
    }
  };

  // One screen pixel, in map units, at the current zoom.
  const u = vb ? vb.w / pxWidth : 1;
  const zoom = world && vb ? world.width / vb.w : 1;
  const labelAll = zoom >= 5;

  const label = (item: Item) =>
    item.place.id === TERMINUS_ID && shown.tsj
      ? 'TORONTO · TERMINUS'
      : item.kind === 'tsj'
        ? `${stationCode(item.place)} ${item.place.city.toUpperCase()}`
        : item.place.city;

  // Every marker drawn this render, with the terminus included when only the
  // line is on. Labels go to the important ones first.
  const drawn: Item[] = [
    ...visible,
    ...(shown.tsj && !shown.home ? [{ kind: 'home' as const, place: terminus }] : []),
  ];
  const rank = (i: Item) =>
    i.place.id === selected ? 0 : i.place.id === hovered ? 1 : i.kind === 'tsj' ? 2 : i.place.id === TERMINUS_ID && shown.tsj ? 3 : 4;
  const spots = placeLabels(
    drawn
      .filter((i) => rank(i) < 4 || labelAll)
      .sort((a, b) => rank(a) - rank(b))
      .map((i) => ({ id: i.place.id, text: label(i), at: points.get(i.place.id) ?? [0, 0], must: rank(i) < 4 })),
    u,
  );

  const renderMarker = (item: Item) => {
    const p = points.get(item.place.id);
    if (!p) return null;
    const isSel = selected === item.place.id;
    const isTerminus = item.place.id === TERMINUS_ID;
    const spot = spots.get(item.place.id);
    return (
      <g
        key={item.place.id}
        className={`tv-marker tv-marker--${item.kind}${isSel ? ' is-selected' : ''}${isTerminus ? ' is-terminus' : ''}`}
        transform={`translate(${p[0]} ${p[1]})`}
        onClick={() => select(item)}
        onMouseEnter={() => setHovered(item.place.id)}
        onMouseLeave={() => setHovered(null)}
      >
        <circle className="tv-marker__hit" r={12 * u} />
        {isSel && <circle className="tv-marker__halo" r={11 * u} />}
        {item.kind === 'home' ? (
          <rect className="tv-marker__dot" x={-4.5 * u} y={-4.5 * u} width={9 * u} height={9 * u} />
        ) : item.kind === 'tsj' ? (
          <circle className="tv-marker__dot" r={6 * u} strokeWidth={3 * u} />
        ) : (
          <circle className="tv-marker__dot" r={3.6 * u} />
        )}
        {isTerminus && shown.tsj && <circle className="tv-marker__terminus" r={9 * u} strokeWidth={2.5 * u} />}
        {spot && (
          <text
            className="tv-marker__label"
            x={spot.x * u}
            y={spot.y * u}
            textAnchor={spot.anchor}
            fontSize={LABEL_PX * u}
            strokeWidth={3 * u}
          >
            {label(item)}
          </text>
        )}
      </g>
    );
  };

  /** First LIST_LIMIT of a group, or all of it once opened. */
  const limited = <T,>(group: string, list: T[]) => (expanded.has(group) ? list : list.slice(0, LIST_LIMIT));

  const moreButton = (group: string, total: number, name: string) =>
    total > LIST_LIMIT ? (
      <button
        type="button"
        className="travel-index__more"
        aria-expanded={expanded.has(group)}
        onClick={() =>
          setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(group)) next.delete(group);
            else next.add(group);
            return next;
          })
        }
      >
        {expanded.has(group) ? '[ SHOW LESS ]' : `[ + ${total - LIST_LIMIT} MORE ${name} ]`}
      </button>
    ) : null;

  const byCountry = (list: Visit[]) => {
    const groups = new Map<string, Visit[]>();
    for (const v of list) groups.set(v.country, [...(groups.get(v.country) ?? []), v]);
    return [...groups.entries()];
  };

  return (
    <PageTransition>
      <section className="section travel-page line--travel">
        <StationHeader
          line="travel"
          name="Travel"
          file="atlas.map"
          desc="where I've been, and where I want to go"
          meta={`${allItems.length} places · ${countryCount} countries · ${stations.length} ${stations.length === 1 ? 'station' : 'stations'}`}
        />

        <div className="tsj-notice">
          <div className="tsj-notice__text">
            <p className="tsj-notice__kicker">[NOW BOARDING]</p>
            <h3 className="tsj-notice__title">Transmundane Subway Journey</h3>
            <p className="tsj-notice__body">
              One city, new country, one photograph. Imagine each trip as a stop on an imaginary subway line that
              ignores both geography and time: Toronto and London are adjacent stations, and the next stop is
              wherever I decide to go next, with whoever (or solo even). Every station gets a single chosen
              photograph (likely of me) in the city, printed with a thick white border, annotated by hand, and
              scanned. It's a long-running personal project of mine, built one stop at a time.
            </p>
          </div>
          <img
            className="tsj-notice__art"
            src="/travel/tsj-train.png"
            width="1040"
            height="322"
            alt="Pixel-art drawing of a two-car TSJ subway train, cream and red with cyan windows, speeding along the track"
            decoding="async"
          />
        </div>

        <div className="travel-controls">
          <div className="travel-controls__group" role="group" aria-label="Show">
            {(['tsj', 'visit', 'home'] as Kind[]).map((k) => (
              <button
                key={k}
                type="button"
                className={`travel-chip travel-chip--${k}`}
                aria-pressed={shown[k]}
                onClick={() => setShown((s) => ({ ...s, [k]: !s[k] }))}
              >
                <span className="travel-chip__key" aria-hidden="true" />
                [{KIND_LABEL[k]}]
              </button>
            ))}
          </div>
          <div className="travel-controls__group" role="group" aria-label="View">
            {regions.map((r) => (
              <button
                key={r.id}
                type="button"
                className="travel-chip travel-chip--region"
                aria-pressed={region === r.id}
                onClick={() => setRegion(r.id)}
              >
                {r.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="travel-stage">
          <div className="travel-map" ref={mapRef} style={world ? { aspectRatio: `${world.width} / ${world.height}` } : undefined}>
            {world && vb ? (
              <svg
                ref={svgRef}
                viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
                className="travel-map__svg"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerEnd}
                onPointerCancel={onPointerEnd}
                role="img"
                aria-label={`World map of ${allItems.length} places across ${countryCount} countries. The list below the map has every place.`}
              >
                <path className="travel-map__land" d={world.land} strokeWidth={0.7 * u} />
                {shown.tsj && line && (
                  <g className="tsj-line">
                    <path className="tsj-line__casing" d={line.out} />
                    <path className="tsj-line__track" d={line.out} />
                    <path className="tsj-line__track tsj-line__track--return" d={line.back} />
                  </g>
                )}
                {/* Drawn least to most important, so stations sit on top. */}
                {visible.filter((i) => i.kind === 'visit').map(renderMarker)}
                {visible.filter((i) => i.kind === 'home').map(renderMarker)}
                {shown.tsj && !shown.home && renderMarker({ kind: 'home', place: terminus })}
                {visible.filter((i) => i.kind === 'tsj').map(renderMarker)}
              </svg>
            ) : (
              <div className="travel-map__loading" aria-hidden="true">loading atlas.map …</div>
            )}
            {world && (
              <div className="travel-zoom" role="group" aria-label="Zoom">
                <button type="button" onClick={() => zoomButton(1.6)} aria-label="Zoom in">+</button>
                <button type="button" onClick={() => zoomButton(1 / 1.6)} aria-label="Zoom out">−</button>
                <button type="button" onClick={() => setRegion('world')} aria-label="Reset to the whole world">⟲</button>
              </div>
            )}
            <p className="travel-map__hint" aria-hidden="true">
              <span className="travel-map__hint--pointer">drag to move · ctrl + scroll to zoom</span>
              <span className="travel-map__hint--touch">two fingers to zoom &amp; move</span>
            </p>
          </div>

          <aside className="travel-card" aria-live="polite">
            {selectedItem ? <PlaceCard item={selectedItem} onClose={() => setSelected(null)} /> : (
              <div className="travel-card__empty">
                <p className="travel-card__eyebrow">[NO STOP SELECTED]</p>
                <p>Pick a dot on the map, or a place from the list below.</p>
                <ul className="travel-legend">
                  <li><span className="travel-legend__key travel-legend__key--tsj" aria-hidden="true" />TSJ station</li>
                  <li><span className="travel-legend__key travel-legend__key--line" aria-hidden="true" />the line (dashed: back to Toronto)</li>
                  <li><span className="travel-legend__key travel-legend__key--home" aria-hidden="true" />lived here</li>
                  <li><span className="travel-legend__key travel-legend__key--visit" aria-hidden="true" />visited</li>
                </ul>
              </div>
            )}
          </aside>
        </div>

        <div className="travel-index">
          {shown.tsj && (
            <div className="travel-index__col">
              <h3 className="travel-index__title">[TSJ STATIONS]</h3>
              <ol className="travel-index__list">
                <li><span className="travel-index__terminus">TORONTO · TERMINUS</span></li>
                {limited('tsj', stations).map((s) => (
                  <li key={s.id}>
                    <button type="button" className="travel-index__item" aria-pressed={selected === s.id} onClick={() => select({ kind: 'tsj', place: s }, true)}>
                      <span className="travel-index__code">{stationCode(s)}</span> {s.city}, {s.country}
                      <span className="travel-index__when">{s.date}</span>
                    </button>
                  </li>
                ))}
              </ol>
              {moreButton('tsj', stations.length, 'STATIONS')}
            </div>
          )}
          {shown.home && (
            <div className="travel-index__col">
              <h3 className="travel-index__title">[LIVED]</h3>
              <ul className="travel-index__list">
                {limited('home', homes).map((h) => (
                  <li key={h.id}>
                    <button type="button" className="travel-index__item" aria-pressed={selected === h.id} onClick={() => select({ kind: 'home', place: h }, true)}>
                      {h.city}, {h.region}
                      <span className="travel-index__when">{h.lived.join(' · ')}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {moreButton('home', homes.length, 'HOMES')}
            </div>
          )}
          {shown.visit && (
            <div className="travel-index__col travel-index__col--wide">
              <h3 className="travel-index__title">[NON-TSJ]</h3>
              {byCountry(visits).map(([country, list]) => (
                <div key={country} className="travel-index__country">
                  <h4 className="travel-index__country-name">{country}</h4>
                  <ul className="travel-index__list">
                    {limited(`visit:${country}`, list).map((v) => (
                      <li key={v.id}>
                        <button type="button" className="travel-index__item" aria-pressed={selected === v.id} onClick={() => select({ kind: 'visit', place: v }, true)}>
                          {v.city}
                          <span className="travel-index__when">{v.when[0]}{v.when.length > 1 ? ` +${v.when.length - 1}` : ''}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {moreButton(`visit:${country}`, list.length, 'IN ' + country.toUpperCase())}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageTransition>
  );
}

function PlaceCard({ item, onClose }: { item: Item; onClose: () => void }) {
  const { place } = item;
  const where = [place.region, place.country].filter(Boolean).join(', ');
  return (
    <div className={`travel-card__body travel-card__body--${item.kind}`}>
      <div className="travel-card__head">
        <p className="travel-card__eyebrow">
          [{item.kind === 'tsj' ? stationCode(item.place) : KIND_LABEL[item.kind]}]
        </p>
        <button type="button" className="travel-card__close" onClick={onClose} aria-label="Close">×</button>
      </div>
      <h3 className="travel-card__city">{place.city}</h3>
      <p className="travel-card__where">{where}</p>

      {item.kind === 'tsj' && (
        <>
          <figure className="tsj-print">
            <div className="tsj-print__photo">
              {item.place.print ? (
                <img src={item.place.print} alt={`The ${place.city} print, ${stationCode(item.place)}`} loading="lazy" decoding="async" />
              ) : (
                <span className="tsj-print__pending">print pending</span>
              )}
            </div>
            <figcaption className="tsj-print__caption">
              {String(item.place.code).padStart(2, '0')} · {place.city} · {item.place.date}
            </figcaption>
          </figure>
          {item.place.before?.length || item.place.after?.length ? (
            <div className="tsj-notes">
              {item.place.before?.length ? (
                <div>
                  <h4>Before</h4>
                  <ul>{item.place.before.map((n) => <li key={n}>{n}</li>)}</ul>
                </div>
              ) : null}
              {item.place.after?.length ? (
                <div>
                  <h4>After</h4>
                  <ul>{item.place.after.map((n) => <li key={n}>{n}</li>)}</ul>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="travel-card__note">Before and after notes to come.</p>
          )}
        </>
      )}

      {item.kind === 'home' && (
        <ul className="travel-card__dates">
          {item.place.lived.map((d) => <li key={d}>{d}</li>)}
        </ul>
      )}
      {item.kind === 'home' && item.place.id === TERMINUS_ID && (
        <p className="travel-card__note">Every TSJ journey leaves from here, and the line always closes back on it.</p>
      )}

      {item.kind === 'visit' && (
        <ul className="travel-card__dates">
          {item.place.when.map((d) => <li key={d}>{d}</li>)}
        </ul>
      )}
    </div>
  );
}
