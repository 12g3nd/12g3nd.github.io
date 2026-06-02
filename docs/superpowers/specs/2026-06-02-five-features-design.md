# Five UI Features — Design Spec
**Date:** 2026-06-02  
**Status:** Approved

---

## 1. Terminal Expand

### What
When the nav terminal is in command mode and has output, show a `▸ Expand` affordance at the right edge of the terminal bar. Clicking it toggles an expanded view that renders the output as a full block below the input row.

### Where
`src/components/Navigation.tsx` + `Navigation.css`

### State
- Add `expanded: boolean` state alongside existing `commandMode`, `input`, `output`.
- Reset `expanded` to `false` on `closeCommandMode()` and each new `runCommand`.

### Layout
- Command mode, output present, `!expanded`: output truncated inline (current behavior), `▸ Expand` button on the right.
- Command mode, output present, `expanded`: output in full block below the prompt row (same as current `--multiline` path), button reads `▸ Collapse`.
- Command mode, no output: no expand button.
- Idle mode: hint stays as `▸ dbl-click` unchanged.

### CSS
- `.terminal-expand-btn`: absolutely positioned right-edge of terminal bar, styled like `.terminal-hint` (dim, uppercase mono), clickable with hover → cyan accent.

---

## 2. SJ Glow

### What
Clicking "SJ" in the description card paragraph causes the S in "SRIHITH" and the J in "JARABANA" to glow briefly in the site's cyan accent.

### Where
`src/pages/Home.tsx` + `Home.css`

### State
- `sjGlow: boolean` in Home component.
- Click handler: set `true`, `setTimeout` 1800ms → set `false`.

### DOM changes
- In the description card: wrap `SJ` with `<span role="button" className="sj-click-trigger" onClick={handleSJGlow}>SJ</span>`.
- In `<h1 className="title-srihith">`: render `<span className={sjGlow ? 'letter-glow' : ''}>S</span>RIHITH`.
- In `<h1 className="outline-text">`: render `<span className={sjGlow ? 'letter-glow' : ''}>J</span>ARABANA`.

### CSS
```css
.letter-glow {
  animation: letter-glow-pulse 1.8s ease-out forwards;
}
@keyframes letter-glow-pulse {
  0%   { text-shadow: 0 0 8px var(--accent-primary), 0 0 24px var(--accent-primary); color: var(--accent-primary); }
  60%  { text-shadow: 0 0 16px var(--accent-primary), 0 0 48px var(--accent-primary); }
  100% { text-shadow: none; color: inherit; }
}
.sj-click-trigger { cursor: pointer; text-decoration: underline dotted; }
```

The `outline-text` (JARABANA) uses `-webkit-text-stroke`, so `text-shadow` won't render on it. Use `filter: drop-shadow(0 0 10px var(--accent-primary))` on the J span instead, and add a brief `color` fill transition to make the stroke color pop.

---

## 3. Smileyface on Party Mode

### What
When the y2k star triggers `splashActive`, show `/public/smileyface.png` on the right side of the viewport 1.5s after the text appears. It fades out when the overlay fades.

### Where
`src/pages/Home.tsx` + new CSS class

### State
- `smileyActive: boolean` in Home.
- When `splashActive` transitions to `true`: push a timer (1500ms) → `setSmileyActive(true)` to `whimsyTimers.current`.
- When overlay unmounts (splashActive → false): `setSmileyActive(false)`.

### DOM
Portal to `document.body` (alongside existing portals), only when `smileyActive`:
```jsx
{smileyActive && createPortal(
  <img src="/smileyface.png" className="whimsy-smiley" aria-hidden="true" />,
  document.body
)}
```

### CSS
```css
.whimsy-smiley {
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  width: auto;
  object-fit: contain;
  z-index: 9997;         /* below overlay (9998) but above party confetti */
  mix-blend-mode: screen; /* black bg disappears; white drawing shows through */
  pointer-events: none;
  animation: smiley-enter 0.6s ease-out forwards;
}
@keyframes smiley-enter {
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

---

## 4. Wavy Text in Party Mode

### What
All `.whimsy-word` elements wave like a flag whenever `body.party-mode` is active (covers both y2k star path and terminal `party mode` command). For terminal-only party mode (no overlay), also wave the nav brand `SJ.SYS`.

### Where
`src/components/WhimsyOverlay.css` + `src/components/Navigation.css`

### Animation
```css
@keyframes word-wave {
  0%   { transform: translateY(0); }
  50%  { transform: translateY(-12px); }
  100% { transform: translateY(0); }
}

body.party-mode .whimsy-word {
  animation: word-wave 0.7s ease-in-out infinite;
}
/* Stagger via nth-child so it flows like a flag */
body.party-mode .whimsy-word:nth-child(1) { animation-delay: 0s; }
body.party-mode .whimsy-word:nth-child(2) { animation-delay: 0.12s; }
body.party-mode .whimsy-word:nth-child(3) { animation-delay: 0.24s; }
body.party-mode .whimsy-word:nth-child(4) { animation-delay: 0.36s; }
body.party-mode .whimsy-word:nth-child(5) { animation-delay: 0.48s; }

/* Nav brand wave for terminal-triggered party mode */
body.party-mode .nav-brand {
  display: inline-block;
  animation: word-wave 0.9s ease-in-out infinite;
}
```

Note: The existing `whimsy-slam` animation plays first (0.45s). The wave applies on top via `body.party-mode` which kicks in at 3s, after the slam completes — no conflict.

---

## 5. `404` Terminal Command

### What
Typing `404` in the nav terminal navigates to `/404`, which hits the `*` wildcard route and renders the NotFound / KERNEL PANIC page.

### Where
`src/components/Navigation.tsx`, inside `runCommand` switch.

### Change
```ts
case '404':
  navigate('/404');
  window.scrollTo(0, 0);
  closeCommandMode();
  return;
```

No output needed — the navigation is the response.

---

## Files Changed Summary

| File | Feature(s) |
|------|-----------|
| `src/components/Navigation.tsx` | 1 (expand), 5 (404 cmd) |
| `src/components/Navigation.css` | 1 (expand btn), 4 (nav-brand wave) |
| `src/pages/Home.tsx` | 2 (SJ glow state+DOM), 3 (smiley state+portal) |
| `src/pages/Home.css` | 2 (letter-glow animation), 3 (whimsy-smiley CSS) |
| `src/components/WhimsyOverlay.css` | 4 (word-wave) |
