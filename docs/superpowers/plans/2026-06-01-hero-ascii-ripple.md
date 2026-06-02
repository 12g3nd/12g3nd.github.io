# Hero ASCII Ripple Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the two existing faint hero ASCII figures react to the cursor with a "Repel & Settle" ripple (finger-in-a-pond), while looking unchanged at rest.

**Architecture:** A single `<canvas>` component (`AsciiRipple`) covers the hero `.info-section`, parses the two braille figures into character "particles," and runs a spring-physics loop that pushes characters away from the cursor and settles them home. Pure logic (parse / layout / physics / palette) lives in a separate, DOM-free module. Non-interactive contexts (reduced-motion, touch/no-fine-pointer) render the original static `<div>`s instead.

**Tech Stack:** React 19 + TypeScript, Vite, Canvas 2D. No new dependencies.

**Testing approach:** This project has **no test runner** (scripts are only `dev`/`build`/`lint`/`preview`), and the effect is a visual/motion feature. Per the approved spec, verification is: `npx tsc -b` (type-check), `npm run lint` (ESLint), and live browser-MCP checks. We do **not** add a test framework. The pure logic is isolated in `asciiRipple.engine.ts` so it stays small and reviewable.

**Branch:** Work continues on `feat/hero-ascii-ripple` (already created; the design spec is committed there).

---

## File Structure

- **Create** `src/components/asciiRipple.engine.ts` — DOM-free: types, constants, the two figure strings, and pure functions (`clampFontSize`, `parseFigure`, `layoutFigure`, `stepField`, `parseRgbTriple`).
- **Create** `src/components/AsciiRipple.tsx` — React component: interactive-vs-static decision, canvas setup, rAF loop, listeners/observers, static fallback.
- **Create** `src/components/AsciiRipple.css` — canvas positioning.
- **Modify** `src/pages/Home.tsx` — replace the two inline ascii `<div>`s with `<AsciiRipple />`; the figure strings move into the engine module.
- **Keep** `src/pages/Home.css` `.ascii-art-bg` / `.ascii-art-secondary` rules — reused by the static fallback branch.

**Quick verify command (used in most tasks):**
```bash
npx tsc -b && npm run lint
```
Expected: completes with no output and exit code 0 (no type errors, no lint errors).

---

## Task 1: Engine module (pure logic + figure data)

**Files:**
- Create: `src/components/asciiRipple.engine.ts`

- [ ] **Step 1: Create the engine file with the full code below.**

> The two figure constants must contain the braille **exactly** as it currently appears in `src/pages/Home.tsx` (the `.ascii-art-bg` block and the `.ascii-art-secondary` block). The art uses U+2800 (`⠀`) as the blank cell — preserve every character. The content below is copied verbatim from the current `Home.tsx`.

```ts
// Pure logic and data for the hero ASCII ripple effect (src/components/AsciiRipple.tsx).
// No React and no DOM access here — text measurement is injected by the caller — so this
// module stays small and easy to reason about.

/** Primary hero figure (verbatim from Home.tsx `.ascii-art-bg`). U+2800 = blank cell. */
export const FIGURE_PRIMARY = [
  '⠀⠀⠀⠀⠀⠀⠀⣀⡄⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠐⢿⠓⠀⢀⡴⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠹⡒⠤⣀⡀⠀⢀⡴⠋⢠⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠱⡀⠀⠉⠑⠋⠀⠀⣸⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⢱⡄⠀⠀⠀⠀⠀⠉⠒⠤⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⡴⠋⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣈⠵⠦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⢀⡤⠋⣀⣀⣀⣤⠀⠀⠀⢰⠋⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠈⠉⠁⠀⠀⠀⠀⢧⠀⠀⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⢐⣶⣆⠀⠀⢠⠈⢇⢰⠃⠀⠀⠀⠀⠀⠀⢀⠀⠀⠀⠀⠀⣰⡄⠀⠀⠀⠀⠀⠀',
  '⠀⠈⠙⠀⠀⠀⣏⣧⠈⠟⠀⠀⠀⠀⠀⠀⠽⡿⠆⠀⠀⠀⢀⣿⣿⣦⣶⣶⠟⠀⠀',
  '⠀⠀⠀⠀⣀⣸⣿⣯⢧⠤⢤⣤⣴⠦⠀⠀⠀⠁⠀⠀⠛⠿⣿⣿⣿⣿⣿⡁⠀⠀⠀',
  '⠀⠙⠯⡻⣿⣿⣿⣿⣿⣿⡿⠟⠁⠀⠰⣄⣠⡇⠀⠀⠀⠀⢸⣿⡿⠛⠛⠿⣆⠀⠀',
  '⠀⠀⠀⠈⢻⣿⣿⣿⣿⣿⠁⠀⠀⠀⣠⢿⣿⠟⠒⠀⠀⠀⠸⠊⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⡾⣿⠿⠺⢝⡯⢧⠀⠀⠀⠀⠀⠻⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⢼⠓⠁⠀⠀⠀⠉⠺⠆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⢿⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡜⠈⡇⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢟⡒⠒⠛⠁⠀⠘⠒⠒⢲⡶⠂⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣤⡆⠀⠈⢢⠀⠀⠀⠀⡤⠚⠁⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⠉⠀⢠⠇⢀⡤⣀⠀⢳⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡿⠊⠁⠀⠈⠳⣼⡄⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⡄⠀⣀⠀⠀⢀⣄⡀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠶⢾⣿⣟⠁⠀⠀⠺⡟⠃',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡏⢉⠓⠀⠀⠀⠀⠀',
].join('\n');

/** Secondary hero figure (verbatim from Home.tsx `.ascii-art-secondary`). */
export const FIGURE_SECONDARY = [
  '⠑⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠘⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠌⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠸⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡴⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠙⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⡟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠹⣷⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣾⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⢿⣿⣄⠀⠀⠀⠀⠀⠀⠀⠀⢀⣼⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠈⣿⣿⣷⣄⠀⠀⠀⢀⣠⣾⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣷⣶⣶⣿⣿⣿⣿⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⢨⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠠⠤⣴⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣤⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠉⠛⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣶⣦⣤⣀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⢷⣶⣶⣤⣤⣄⣀⣀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⣸⣿⣿⠿⠿⣿⣿⣿⣿⣿⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠁⠀⠒',
  '⠀⠀⠀⠀⠀⣠⠟⠋⠁⠀⠀⠀⠙⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠐⠁⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣿⣷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣿⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢳⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠱⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠱⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
].join('\n');

export interface Particle {
  hx: number; hy: number;   // home position (rest)
  x: number; y: number;     // current position
  vx: number; vy: number;   // velocity
  ch: string;               // the glyph
  phase: number;            // idle-shimmer phase offset
}

export interface RGB { r: number; g: number; b: number; }

export interface PhysicsConfig {
  radius: number;
  strength: number;
  spring: number;
  damping: number;
}

export interface Pointer { x: number; y: number; active: boolean; }

/** Medium intensity — the approved default. */
export const MEDIUM: PhysicsConfig = { radius: 88, strength: 1.5, spring: 0.05, damping: 0.82 };
export const BASE_ALPHA = 0.06;     // resting glyph opacity (matches the ~0.05 site default)
export const DISP_NORM = 55;        // displacement at which a glyph is "fully" disturbed
export const GLOW_THRESHOLD = 0.15; // disturbance level above which the cyan glow kicks in

const BLANK = new Set([' ', '⠀']); // ASCII space + braille blank

/** clamp(min, perVw * viewportWidth, max) — replicates the CSS `clamp(...vw...)` sizing. */
export function clampFontSize(viewportWidth: number, perVw: number, min: number, max: number): number {
  return Math.max(min, Math.min(perVw * viewportWidth, max));
}

export interface FigureShape { rows: string[]; cols: number; }

export function parseFigure(art: string): FigureShape {
  const rows = art.split('\n');
  const cols = rows.reduce((m, r) => Math.max(m, r.length), 0);
  return { rows, cols };
}

export type Anchor = 'center' | 'right';

/**
 * Build particles for one figure, positioned in section-space.
 * `anchorX` is the block centre when anchor='center', or its right edge when anchor='right'.
 */
export function layoutFigure(
  art: string,
  opts: { fontSize: number; cellW: number; anchorX: number; topY: number; anchor: Anchor },
): Particle[] {
  const { fontSize, cellW, anchorX, topY, anchor } = opts;
  const { rows, cols } = parseFigure(art);
  const lineH = fontSize * 1.2;
  const blockW = cols * cellW;
  const originX = anchor === 'center' ? anchorX - blockW / 2 : anchorX - blockW;
  const particles: Particle[] = [];
  for (let r = 0; r < rows.length; r++) {
    const line = rows[r];
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (BLANK.has(ch)) continue;
      const hx = originX + c * cellW + cellW / 2;
      const hy = topY + r * lineH + lineH / 2;
      particles.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0, ch, phase: Math.random() * Math.PI * 2 });
    }
  }
  return particles;
}

/** Advance every particle one frame (repel from pointer, spring home, damp). Mutates in place. */
export function stepField(particles: Particle[], pointer: Pointer, cfg: PhysicsConfig): void {
  const { radius, strength, spring, damping } = cfg;
  for (const g of particles) {
    if (pointer.active) {
      const dx = g.x - pointer.x;
      const dy = g.y - pointer.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      if (dist < radius) {
        const f = (1 - dist / radius) * strength;
        g.vx += (dx / dist) * f;
        g.vy += (dy / dist) * f;
      }
    }
    g.vx += (g.hx - g.x) * spring;
    g.vy += (g.hy - g.y) * spring;
    g.vx *= damping;
    g.vy *= damping;
    g.x += g.vx;
    g.y += g.vy;
  }
}

/** Parse a CSS custom-property value like "253, 246, 227" into an RGB triple. */
export function parseRgbTriple(value: string, fallback: RGB): RGB {
  const parts = value.split(',').map((p) => parseInt(p.trim(), 10));
  if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
    return { r: parts[0], g: parts[1], b: parts[2] };
  }
  return fallback;
}
```

- [ ] **Step 2: Type-check and lint.**

Run: `npx tsc -b && npm run lint`
Expected: no output, exit 0. (The module is unused so far, which is fine — it compiles standalone.)

- [ ] **Step 3: Commit.**

```bash
git add src/components/asciiRipple.engine.ts
git commit -m "feat: add ascii ripple engine (pure layout + physics)"
```

---

## Task 2: AsciiRipple component + CSS

**Files:**
- Create: `src/components/AsciiRipple.css`
- Create: `src/components/AsciiRipple.tsx`

- [ ] **Step 1: Create `src/components/AsciiRipple.css`.**

```css
/* Canvas overlay for the hero ASCII ripple. Covers .info-section, sits behind the
   hero content (z-index 0), and never intercepts pointer events so clicks/links in
   the hero keep working. The static-fallback path reuses .ascii-art-bg /
   .ascii-art-secondary from Home.css. */
.ascii-ripple {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}
```

- [ ] **Step 2: Create `src/components/AsciiRipple.tsx` with the full code below.**

```tsx
import { useEffect, useRef, useState } from 'react';
import {
  FIGURE_PRIMARY,
  FIGURE_SECONDARY,
  MEDIUM,
  BASE_ALPHA,
  DISP_NORM,
  GLOW_THRESHOLD,
  layoutFigure,
  stepField,
  parseRgbTriple,
  clampFontSize,
  type Particle,
  type RGB,
  type Pointer,
} from './asciiRipple.engine';
import './AsciiRipple.css';

const CREAM: RGB = { r: 253, g: 246, b: 227 };
const CYAN: RGB = { r: 0, g: 229, b: 255 };

// Animate only with a real hovering cursor and no reduced-motion preference.
function queryInteractive(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return (
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  );
}

export default function AsciiRipple() {
  const [interactive, setInteractive] = useState(queryInteractive);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Re-decide if the user's motion preference or pointer capabilities change.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mqs = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(hover: hover) and (pointer: fine)'),
    ];
    const onChange = () => setInteractive(queryInteractive());
    mqs.forEach((mq) => mq.addEventListener('change', onChange));
    return () => mqs.forEach((mq) => mq.removeEventListener('change', onChange));
  }, []);

  useEffect(() => {
    if (!interactive) return;
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement as HTMLElement | null;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !parent || !ctx) return;

    let raf = 0;
    let running = false;
    let onscreen = true;
    let fieldP: Particle[] = [];
    let fieldS: Particle[] = [];
    let fsP = 12;
    let fsS = 10;
    let w = 0;
    let h = 0;

    const pointerClient = { x: -9999, y: -9999, has: false };
    const pointer: Pointer = { x: -9999, y: -9999, active: false };
    const palette = { cream: CREAM, cyan: CYAN };

    const readPalette = () => {
      const cs = getComputedStyle(canvas);
      palette.cream = parseRgbTriple(cs.getPropertyValue('--text-rgb'), CREAM);
      palette.cyan = parseRgbTriple(cs.getPropertyValue('--accent-rgb'), CYAN);
    };

    const build = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const vw = window.innerWidth;
      fsP = clampFontSize(vw, 0.012, 10, 18);
      fsS = clampFontSize(vw, 0.01, 8, 16);
      ctx.font = `${fsP}px 'Space Mono', monospace`;
      const cellP = ctx.measureText('⣿').width || fsP * 0.6;
      ctx.font = `${fsS}px 'Space Mono', monospace`;
      const cellS = ctx.measureText('⣿').width || fsS * 0.6;

      fieldP = layoutFigure(FIGURE_PRIMARY, {
        fontSize: fsP, cellW: cellP, anchorX: 0.55 * w, topY: 0.15 * h, anchor: 'center',
      });
      fieldS = layoutFigure(FIGURE_SECONDARY, {
        fontSize: fsS, cellW: cellS, anchorX: 0.95 * w, topY: 0, anchor: 'right',
      });
    };

    const drawField = (field: Particle[], fontSize: number, t: number) => {
      ctx.font = `${fontSize}px 'Space Mono', monospace`;
      for (const g of field) {
        const disp = Math.hypot(g.x - g.hx, g.y - g.hy);
        const k = Math.min(disp / DISP_NORM, 1);
        const breathing = 0.86 + 0.14 * Math.sin(t * 0.0015 + g.phase);
        const alpha = Math.min((BASE_ALPHA + k * 0.5) * breathing, 0.95);
        const col = k > 0.04 ? palette.cyan : palette.cream;
        if (k > GLOW_THRESHOLD) {
          ctx.shadowColor = `rgba(${palette.cyan.r},${palette.cyan.g},${palette.cyan.b},${k * 0.6})`;
          ctx.shadowBlur = 12 * k;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fillStyle = `rgba(${col.r},${col.g},${col.b},${alpha})`;
        ctx.fillText(g.ch, g.x, g.y);
      }
      ctx.shadowBlur = 0;
    };

    const frame = (t: number) => {
      if (!running) return;
      const rect = canvas.getBoundingClientRect();
      if (pointerClient.has) {
        pointer.x = pointerClient.x - rect.left;
        pointer.y = pointerClient.y - rect.top;
        pointer.active =
          pointer.x >= -40 && pointer.y >= -40 && pointer.x <= w + 40 && pointer.y <= h + 40;
      } else {
        pointer.active = false;
      }
      ctx.clearRect(0, 0, w, h);
      stepField(fieldP, pointer, MEDIUM);
      stepField(fieldS, pointer, MEDIUM);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      drawField(fieldP, fsP, t);
      drawField(fieldS, fsS, t);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || !onscreen || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onPointerMove = (e: PointerEvent) => {
      pointerClient.x = e.clientX;
      pointerClient.y = e.clientY;
      pointerClient.has = true;
    };
    const onPointerLeave = () => { pointerClient.has = false; };
    const onVisibility = () => { if (document.hidden) stop(); else start(); };

    let resizeT = 0;
    const onResize = () => {
      window.clearTimeout(resizeT);
      resizeT = window.setTimeout(build, 150);
    };

    const io = new IntersectionObserver(
      (entries) => {
        onscreen = entries[0]?.isIntersecting ?? true;
        if (onscreen) start(); else stop();
      },
      { threshold: 0 },
    );
    const themeObs = new MutationObserver(readPalette);

    readPalette();
    build();
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    io.observe(parent);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    themeObs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    // Fonts load async; remeasure once they're ready so cell widths line up.
    document.fonts?.ready.then(build).catch(() => {});
    start();

    return () => {
      stop();
      window.clearTimeout(resizeT);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      io.disconnect();
      themeObs.disconnect();
    };
  }, [interactive]);

  if (!interactive) {
    return (
      <>
        <div className="ascii-art-bg" aria-hidden="true">{FIGURE_PRIMARY}</div>
        <div className="ascii-art-secondary" aria-hidden="true">{FIGURE_SECONDARY}</div>
      </>
    );
  }
  return <canvas ref={canvasRef} className="ascii-ripple" aria-hidden="true" />;
}
```

- [ ] **Step 3: Type-check and lint.**

Run: `npx tsc -b && npm run lint`
Expected: no output, exit 0.

> If ESLint flags `document.fonts?.ready.then(build).catch(() => {})` for a floating promise, the `.catch(() => {})` already handles it; no change needed. If it flags the `as HTMLElement | null` cast, leave it — `parentElement` is otherwise `HTMLElement | null` and the null is handled.

- [ ] **Step 4: Commit.**

```bash
git add src/components/AsciiRipple.tsx src/components/AsciiRipple.css
git commit -m "feat: add AsciiRipple canvas component with static fallback"
```

---

## Task 3: Wire into Home, remove the old static divs

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Add the import.**

In `src/pages/Home.tsx`, add this import alongside the other component imports near the top (after `import ScrambleText from '../components/ScrambleText';`):

```tsx
import AsciiRipple from '../components/AsciiRipple';
```

- [ ] **Step 2: Replace the two ascii `<div>` blocks with the component.**

Find the two blocks at the start of `<section className="section info-section">` — the `<div className="ascii-art-bg">{`…`}</div>` and `<div className="ascii-art-secondary">{`…`}</div>` (together they span the long braille literals). Delete **both** divs entirely and replace them with a single line:

```tsx
        <AsciiRipple />
```

The result should look like:

```tsx
      <section className="section info-section">
        <AsciiRipple />

        <div className="hero-content">
```

- [ ] **Step 3: Type-check and lint.**

Run: `npx tsc -b && npm run lint`
Expected: no output, exit 0. (The big braille literals are now only in `asciiRipple.engine.ts`.)

- [ ] **Step 4: Commit.**

```bash
git add src/pages/Home.tsx
git commit -m "feat: use AsciiRipple in Home hero (replaces static ascii art)"
```

---

## Task 4: Live verification (browser MCP)

**Goal:** Confirm the ripple works, looks right, doesn't block clicks, and that the static fallback / theme paths are correct. No code unless a check fails.

- [ ] **Step 1: Start the dev server (background).**

Run (background): `npm run dev`
Expected: Vite prints `Local: http://localhost:5173/`. (If the port differs, use the one printed.)

- [ ] **Step 2: Load the page and check the console.**

Use the Playwright MCP:
- `browser_navigate` → `http://localhost:5173/`
- `browser_console_messages` (level `error`)

Expected: no application errors (a `favicon`/asset 404 is acceptable). If the boot sequence is showing, wait for it to finish (it runs once per session) or navigate again.

- [ ] **Step 3: Drive the cursor through the hero and screenshot.**

`browser_evaluate`:
```js
() => {
  const c = document.querySelector('canvas.ascii-ripple');
  if (!c) return { error: 'no canvas — interactive path not active' };
  const r = c.getBoundingClientRect();
  const y = r.top + r.height * 0.32;            // band where the primary figure sits
  for (let i = 0; i <= 24; i++) {
    const x = r.left + r.width * (0.30 + 0.40 * (i / 24));
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, bubbles: true }));
  }
  return { w: c.width, h: c.height, css: [Math.round(r.width), Math.round(r.height)] };
}
```
Then `browser_take_screenshot`.
Expected: a faint braille figure with a cyan-glowing disturbance along the swept band (characters parted/brightened). Returned object has a non-zero canvas size and no `error`.

- [ ] **Step 4: Confirm clicks pass through the canvas.**

`browser_evaluate`:
```js
() => {
  const link = document.querySelector('.hero-actions a');
  if (!link) return { error: 'no hero CTA found' };
  const r = link.getBoundingClientRect();
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return { topElementIsLinkOrChild: link.contains(hit) || hit === link, hitTag: hit && hit.tagName };
}
```
Expected: `topElementIsLinkOrChild: true` (the canvas's `pointer-events:none` lets the CTA receive clicks).

- [ ] **Step 5: Verify theme tracking.**

`browser_evaluate`:
```js
() => {
  const c = document.querySelector('canvas.ascii-ripple');
  const before = getComputedStyle(c).getPropertyValue('--accent-rgb').trim();
  document.body.classList.add('theme-light');
  const after = getComputedStyle(c).getPropertyValue('--accent-rgb').trim();
  document.body.classList.remove('theme-light');
  return { before, after, changed: before !== after };
}
```
Expected: `before` ≈ `0, 229, 255`, `after` ≈ `10, 125, 140`, `changed: true` (the `MutationObserver` re-reads the palette; glyph colors follow the theme).

- [ ] **Step 6: Reduced-motion / static-fallback check (code inspection + spot check).**

The interactive gate is `queryInteractive()` in `AsciiRipple.tsx`: it returns `false` when `(prefers-reduced-motion: reduce)` matches, so the component renders the two static `<div>`s and runs no loop. Confirm by reading that function. Optional manual spot-check: enable the OS "reduce motion" setting, reload, and confirm the hero shows the static figures (no canvas: `document.querySelector('canvas.ascii-ripple')` is `null`).

- [ ] **Step 7: Stop the dev server.**

Stop the background `npm run dev` task.

- [ ] **Step 8: Commit any fixes.**

Only if Steps 2–6 required changes:
```bash
git add -A
git commit -m "fix: address AsciiRipple verification findings"
```

---

## Task 5: Tuning checkpoint + finish

- [ ] **Step 1: Review the feel with the user.**

Share a screenshot (or ask them to view `http://localhost:5173/`). Confirm intensity/faintness feel right. If they want changes, adjust the constants in `asciiRipple.engine.ts` (`MEDIUM.radius`, `MEDIUM.strength`, `MEDIUM.spring`, `MEDIUM.damping`, `BASE_ALPHA`) and/or the glow/breathing in `AsciiRipple.tsx` (`12 * k`, `0.86 + 0.14 * …`). Re-verify with `npx tsc -b && npm run lint` and a screenshot. Commit each adjustment:
```bash
git add -A
git commit -m "style: tune AsciiRipple intensity"
```

- [ ] **Step 2: Final full build.**

Run: `npm run build`
Expected: `tsc -b` passes and `vite build` completes with no errors.

- [ ] **Step 3: Hand off for merge.**

Summarize what changed and offer to open a PR or merge `feat/hero-ascii-ripple` into `main` (use the `superpowers:finishing-a-development-branch` skill). Do not merge without the user's go-ahead.

---

## Self-Review (completed during planning)

- **Spec coverage:** behavior A/medium physics (Task 1 `MEDIUM`, `stepField`); existing-art scope, both figures (Task 1 figures + Task 2 layout); placement mapping (Task 2 `build`); resting faintness 0.06 (Task 1 `BASE_ALPHA`); glow/breathing (Task 2 `drawField`); reduced-motion + touch fallback (Task 2 `queryInteractive` + static branch); theme tracking (Task 2 `readPalette` + `MutationObserver`, verified Task 4 Step 5); performance pause (Task 2 `IntersectionObserver` + `visibilitychange`); pointer-events:none (Task 2 CSS, verified Task 4 Step 4); aria-hidden (Task 2). All spec sections map to a task.
- **Placeholders:** none — full code in every code step; figure data included verbatim.
- **Type consistency:** `Particle`, `Pointer`, `PhysicsConfig`, `RGB`, `layoutFigure`, `stepField`, `parseRgbTriple`, `clampFontSize` names/signatures match between Task 1 (definitions) and Task 2 (call sites).
