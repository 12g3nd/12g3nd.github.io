# Hero ASCII Ripple — Design Spec

- **Date:** 2026-06-01
- **Status:** Approved (brainstorm) → ready for implementation plan
- **Area:** Home hero (`src/pages/Home.tsx`)

## Summary

Make the two existing faint ASCII-art figures in the Home hero react to the cursor. At
rest they look essentially as they do today (cyan-on-navy braille, barely-there). As the
cursor passes, each figure's characters are pushed aside and spring back — a "finger in a
pond" ripple ("Repel & Settle", medium intensity) — with the disturbance glowing cyan in
the cursor's wake. No new glyphs, no starfield; Home hero only.

## Goals

- Cursor-driven repel-and-settle displacement of the existing hero ASCII characters.
- Preserve the current resting appearance, placement, and faintness.
- Honor the site's existing motion/accessibility discipline (reduced-motion, theme, perf).

## Non-goals

- No new background symbols or starfield (the "add more symbols" idea was dropped by the user).
- No effect outside the Home hero; no change to other pages or to the global crosshair cursor.

## Background (current state)

`src/pages/Home.tsx` renders two decorative braille figures inside `.info-section`
(which is `position:relative`):

- `.ascii-art-bg` — primary figure. CSS: absolute, `top:15%; left:55%;
  transform:translateX(-50%)`, `font-size:clamp(10px,1.2vw,18px)`, `line-height:1.2`,
  `color:rgba(var(--text-rgb),0.05)`, cyan text-shadow.
- `.ascii-art-secondary` — secondary figure. CSS: absolute, `top:0; right:5%`,
  `font-size:clamp(8px,1vw,16px)`, otherwise the same treatment.

Both are `pointer-events:none`, `z-index:0`, `user-select:none`, `white-space:pre`.

## Design

### Component

New `src/components/AsciiRipple.tsx`, rendered where the two divs currently sit (first
child of `.info-section`). It owns the two braille strings (copied verbatim from the
current `Home.tsx`) and chooses between an **interactive canvas** and a **static fallback**:

```
interactive = !prefers-reduced-motion && matchMedia('(hover:hover) and (pointer:fine)').matches
```

- **interactive = true** → render `<canvas class="ascii-ripple" aria-hidden="true">`
  absolutely covering `.info-section`.
- **interactive = false** → render the two original `<div class="ascii-art-bg">` /
  `<div class="ascii-art-secondary">` blocks unchanged (today's look, zero JS).

Re-evaluate on the `change` event of both media queries and swap modes.

### Canvas rendering

- Canvas: `position:absolute; inset:0; width:100%; height:100%` of `.info-section`,
  `pointer-events:none`, `z-index:0`.
- Backing store sized to `clientW*dpr × clientH*dpr`, `dpr = min(devicePixelRatio, 2)`;
  context scaled by `dpr`; rebuilt on resize (debounced ~150ms).
- Both figures are laid out in section coordinates, replicating the current placement:
  - Per-figure font size replicates the CSS `clamp`: primary
    `clamp(10, 0.012*innerWidth, 18)px`, secondary `clamp(8, 0.01*innerWidth, 16)px`.
  - Cell width = `ctx.measureText('⣿').width` at that font; line height = `fontSize * 1.2`.
  - **Primary:** block horizontally centered at `x = 0.55*sectionW`, top at `y = 0.15*sectionH`
    (mirrors `left:55%` + `translateX(-50%)` + `top:15%`).
  - **Secondary:** block right edge at `x = 0.95*sectionW`, top at `y = 0` (mirrors `right:5%`, `top:0`).
  - Each non-blank cell (skip `' '` and `'⠀'` U+2800) becomes a particle:
    `{ hx, hy, x, y, vx, vy, ch, phase }` (`h*` = home position).

### Physics (per particle, per frame) — medium preset

```
if pointer is inside the section (with a 40px margin):
    d = distance(particle, pointer)
    if d < R:
        f = (1 - d/R) * STRENGTH
        v += (unit vector away from pointer) * f
v += (home - pos) * SPRING      // settle back toward home
v *= DAMPING
pos += v
```

Constants: `R = 88`, `STRENGTH = 1.5`, `SPRING = 0.05`, `DAMPING = 0.82`.

### Visual treatment

- `disp = distance(pos, home)`; `k = min(disp / 55, 1)` (0 = at rest, 1 = max disturbed).
- Resting alpha `BASE = 0.06` (vs `0.05` today — imperceptible); `alpha = (BASE + k*0.5) * breathing`.
- `breathing = 0.86 + 0.14 * sin(t*0.0015 + phase)` — subtle idle shimmer.
- Color: cream (`--text-rgb`) at rest; cyan (`--accent-rgb`) when `k > 0.04`.
- Glow: when `k > 0.15`, `shadowColor = cyan @ k*0.6`, `shadowBlur = 12*k`; otherwise `shadowBlur = 0`.
- Final alpha clamped to `≤ 0.95`.

### Pointer handling

- A `window` `pointermove` listener stores client coords; `pointerleave` clears the
  "has pointer" flag.
- Each frame maps client coords into canvas space via `getBoundingClientRect()`. "Inside"
  = within the section bounds + 40px. When not inside / no pointer, no repel force is
  applied and particles settle home.

### Theme adaptation

- Read `--text-rgb` and `--accent-rgb` via `getComputedStyle(canvas)` at init (the canvas
  inherits whatever cascades, including the `.theme-light` easter-egg, regardless of which
  ancestor carries the class).
- Re-read on theme change via a `MutationObserver` watching the `class` attribute of
  `document.documentElement` and `document.body`.

### Performance

- `IntersectionObserver` on the section: pause the rAF loop when the hero is fully out of
  view; resume on re-entry.
- `visibilitychange`: pause while `document.hidden`.
- On unmount: `cancelAnimationFrame`, disconnect observers, remove listeners.

## Files

- **Add** `src/components/AsciiRipple.tsx`
- **Add** `src/components/AsciiRipple.css` (canvas positioning)
- **Edit** `src/pages/Home.tsx` — import and replace the two ascii `<div>`s with `<AsciiRipple />`
- **Keep** `.ascii-art-bg` / `.ascii-art-secondary` rules in `src/pages/Home.css` (reused
  by the static-fallback branch)

## Accessibility

- Canvas and fallback divs are `aria-hidden="true"` (purely decorative).
- Reduced-motion users get the fully static figures (no canvas, no loop) — identical to today.

## Testing / verification

- `npm run lint` and `npm run build` clean (per `package.json` scripts).
- Dev server + browser MCP: load `/`, sweep the cursor through the hero → confirm
  characters part, glow cyan, and knit back together; confirm hero buttons/links still
  click through (canvas is `pointer-events:none`); emulate `prefers-reduced-motion: reduce`
  → confirm static figures; toggle `theme light` → confirm colors track.

## Tuning knobs (expected, post-build)

`R`, `STRENGTH`, `SPRING`, `DAMPING`, `BASE` alpha, glow amount, breathing amplitude.
Resolved defaults: **both** figures interactive; resting alpha **0.06**.
