# Five UI Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement five independent UI enhancements: terminal expand output, SJ glow interaction, smileyface party overlay, wavy party-mode text, and `404` terminal command.

**Architecture:** All changes are purely frontend, no new components except CSS additions. Features 1 and 5 live in `Navigation.tsx/css`; Features 2 and 3 live in `Home.tsx/css`; Feature 4 spans `WhimsyOverlay.css` and `Navigation.css`.

**Tech Stack:** React 19, TypeScript, Vite 8, CSS animations (no new libraries)

---

## Files Modified

| File | What changes |
|------|-------------|
| `src/components/Navigation.tsx` | Add `expanded` state + expand button (F1); add `404` case (F5) |
| `src/components/Navigation.css` | Expand button styles (F1); nav-brand wave (F4) |
| `src/pages/Home.tsx` | `sjGlow` state + S/J letter spans + "SJ" trigger (F2); `smileyActive` state + portal (F3) |
| `src/pages/Home.css` | `letter-glow` animation (F2); `.whimsy-smiley` styles (F3) |
| `src/components/WhimsyOverlay.css` | `word-wave` animation scoped to `body.party-mode` (F4) |

---

## Task 1: Terminal Expand — State + Reset

**Files:**
- Modify: `src/components/Navigation.tsx`

- [ ] **Step 1: Add `expanded` state**

In `Navigation.tsx`, add `expanded` alongside the existing easter-egg states (around line 55):

```tsx
const [expanded, setExpanded] = useState(false);
```

- [ ] **Step 2: Reset `expanded` in `closeCommandMode`**

Replace the existing `closeCommandMode` function:

```tsx
const closeCommandMode = () => {
  setCommandMode(false);
  setInput('');
  setOutput('');
  setExpanded(false);
};
```

- [ ] **Step 3: Reset `expanded` at the start of `runCommand`**

In `runCommand`, add one line immediately after the `const cmd = ...` line:

```tsx
const runCommand = (raw: string) => {
  const cmd = raw.trim().toLowerCase();
  setExpanded(false);   // ← add this line
  if (!cmd) return;
  // ... rest unchanged
```

- [ ] **Step 4: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```
git add src/components/Navigation.tsx
git commit -m "feat: add expanded state to terminal"
```

---

## Task 2: Terminal Expand — Expand Button UI

**Files:**
- Modify: `src/components/Navigation.tsx`
- Modify: `src/components/Navigation.css`

- [ ] **Step 1: Update `terminalBody` to render the expand button**

In `Navigation.tsx`, the `multiline` declaration and `terminalBody` assignment sit adjacent (around lines 294–324). Keep the `const multiline = output.includes('\n');` line unchanged. Replace only the `const terminalBody = ...` assignment below it.

Key changes:
1. `multiline || expanded` drives `--multiline` class (so expanded single-line uses the block layout)
2. Expand button appears only when `output && !multiline` (multiline auto-expands, no button needed)
3. `onMouseDown={(e) => e.preventDefault()}` prevents the input's `onBlur` from firing when clicking the button

```tsx
const terminalBody = commandMode ? (
  <div className={`terminal-cmd${multiline || expanded ? ' terminal-cmd--multiline' : ''}`}>
    <span className="terminal-prompt">srihith@sj.sys</span>
    <span className="terminal-prompt-sep">:~$</span>
    <input
      className="terminal-input"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={closeCommandMode}
      spellCheck={false}
      autoComplete="off"
      aria-label="Terminal command input"
    />
    {output && (
      <span className={`terminal-output${multiline || expanded ? ' terminal-output--block' : ''}`}>
        {output}
      </span>
    )}
    {output && !multiline && (
      <button
        type="button"
        className="terminal-expand-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setExpanded((e) => !e)}
        aria-label={expanded ? 'Collapse output' : 'Expand output'}
      >
        ▸ {expanded ? 'Collapse' : 'Expand'}
      </button>
    )}
  </div>
) : (
  <>
    <span className="terminal-idle">
      <span className="terminal-text">{text}</span>
      <span className="terminal-cursor">_</span>
    </span>
    <span className="terminal-hint" aria-hidden="true">▸ dbl-click</span>
  </>
);
```

- [ ] **Step 2: Add expand button CSS to `Navigation.css`**

Append to `src/components/Navigation.css`:

```css
.terminal-expand-btn {
  flex: 0 0 auto;
  margin-left: auto;
  padding-left: 1.25rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(var(--text-rgb), 0.35);
  white-space: nowrap;
  transition: color 0.15s ease;
}

.terminal-expand-btn:hover {
  color: var(--accent-primary);
}
```

- [ ] **Step 3: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Visual verification**

Run `npm run dev`. Open the site. Double-click the terminal bar. Type `whoami` and press Enter. Verify:
- Output appears inline, truncated, with `▸ Expand` button on the right.
- Clicking `▸ Expand` drops the output into a block below.
- Button changes to `▸ Collapse`.
- Clicking `▸ Collapse` returns to inline.
- Type `cat rootbeer.log` — multiline output auto-expands, no expand button shown.
- Press Escape — terminal closes, `expanded` resets.

- [ ] **Step 5: Commit**

```
git add src/components/Navigation.tsx src/components/Navigation.css
git commit -m "feat: add expand/collapse toggle for terminal output"
```

---

## Task 3: 404 Terminal Command

**Files:**
- Modify: `src/components/Navigation.tsx`

- [ ] **Step 1: Add the `404` case to `runCommand`**

In `Navigation.tsx`, inside the `switch (cmd)` block, add this case immediately before `default:`:

```tsx
case '404':
  navigate('/404');
  window.scrollTo(0, 0);
  closeCommandMode();
  return;
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Visual verification**

Double-click the terminal. Type `404` and press Enter. Verify you land on the KERNEL PANIC / NotFound page.

- [ ] **Step 4: Commit**

```
git add src/components/Navigation.tsx
git commit -m "feat: add 404 terminal command to navigate to NotFound page"
```

---

## Task 4: SJ Glow — State and Handlers

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Add `sjGlow` state and timer ref**

In `Home.tsx`, near the top of the component (alongside `elevatorTimer`), add:

```tsx
const [sjGlow, setSjGlow] = useState(false);
const sjGlowTimer = useRef<number>(0);
```

- [ ] **Step 2: Add the click handler**

Directly after the `sjGlowTimer` ref declaration, add:

```tsx
const triggerSjGlow = () => {
  window.clearTimeout(sjGlowTimer.current);
  setSjGlow(true);
  sjGlowTimer.current = window.setTimeout(() => setSjGlow(false), 1800);
};
```

- [ ] **Step 3: Include `sjGlowTimer` in the cleanup effect**

The existing cleanup effect at the bottom already handles `whimsyTimers`. Find it and add the sjGlowTimer cleanup:

```tsx
useEffect(
  () => () => {
    whimsyTimers.current.forEach((t) => window.clearTimeout(t));
    window.clearTimeout(sjGlowTimer.current);
    document.body.classList.remove('party-mode');
  },
  []
);
```

- [ ] **Step 4: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```
git add src/pages/Home.tsx
git commit -m "feat: add sjGlow state and triggerSjGlow handler"
```

---

## Task 5: SJ Glow — DOM and CSS

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/Home.css`

- [ ] **Step 1: Wrap the S in SRIHITH**

In `Home.tsx`, find the `<h1 className="title-srihith">` element. Change it so the S is wrapped:

```tsx
<h1 className="title-srihith">
  <span className={sjGlow ? 'letter-glow' : ''}>S</span>RIHITH
  <img
    src="/y2k1.png"
    alt="Activate whimsy mode"
    className={`y2k-accent${partyActive && !calmMode ? ' y2k-spinning' : ''}`}
    role="button"
    tabIndex={0}
    onClick={triggerWhimsy}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerWhimsy(); } }}
  />
</h1>
```

- [ ] **Step 2: Wrap the J in JARABANA**

Find `<h1 className="outline-text">JARABANA</h1>` and change it:

```tsx
<h1 className="outline-text">
  <span className={sjGlow ? 'letter-glow' : ''}>J</span>ARABANA
</h1>
```

- [ ] **Step 3: Make "SJ" clickable in the description card**

Find the paragraph starting with `'SJ' also welcome`. Change only the "SJ" text to a clickable span (leave the surrounding single-quotes as literal text):

```tsx
<p>
  '<span
    role="button"
    tabIndex={0}
    className="sj-trigger"
    onClick={triggerSjGlow}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerSjGlow(); } }}
  >SJ</span>' also welcome. 19. Businessman by craft. Also, strong STEM and literature background.
  Welcome to my personal (and humble) corner of the internet.
</p>
```

- [ ] **Step 4: Add glow CSS to `Home.css`**

Append to `src/pages/Home.css`:

```css
/* ── SJ glow interaction ───────────────────────────────── */
.sj-trigger {
  cursor: pointer;
  text-decoration: underline dotted rgba(var(--accent-rgb), 0.4);
  text-underline-offset: 3px;
}

@keyframes letter-glow-pulse {
  0%   { filter: drop-shadow(0 0 6px var(--accent-primary)) drop-shadow(0 0 14px var(--accent-primary)); }
  50%  { filter: drop-shadow(0 0 10px var(--accent-primary)) drop-shadow(0 0 28px var(--accent-primary)); }
  100% { filter: none; }
}

.letter-glow {
  display: inline-block;
  animation: letter-glow-pulse 1.8s ease-out forwards;
}
```

Note: `filter: drop-shadow` works on both the filled S (title-srihith) and the stroked J (outline-text, which uses `-webkit-text-stroke` with transparent fill). `display: inline-block` is required for `filter` on inline elements.

- [ ] **Step 5: Type-check + visual check**

```
npx tsc --noEmit
```

Run `npm run dev`. Click "SJ" in the description card. Verify the S in SRIHITH and J in JARABANA glow cyan for ~1.8s then fade back. Check that the glow resets if you click rapidly.

- [ ] **Step 6: Commit**

```
git add src/pages/Home.tsx src/pages/Home.css
git commit -m "feat: clicking SJ in bio glows S in SRIHITH and J in JARABANA"
```

---

## Task 6: Smileyface Overlay

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/Home.css`

- [ ] **Step 1: Add `smileyActive` state**

In `Home.tsx`, near the other party/splash states, add:

```tsx
const [smileyActive, setSmileyActive] = useState(false);
```

- [ ] **Step 2: Fire smiley timers inside `triggerWhimsy`**

In `triggerWhimsy`, push two more timers into `whimsyTimers.current` — one to show, one to hide. They should be added inside the existing `whimsyTimers.current.push(...)` call. The smiley appears 1500ms after the text and disappears when the overlay does.

Replace the existing `triggerWhimsy` function with:

```tsx
const triggerWhimsy = () => {
  if (partyActive || splashActive) return;
  const calm = prefersReducedMotion();
  setCalmMode(calm);
  setSplashActive(true);

  const partyDelay   = calm ? 99999 : 3000;
  const splashLife   = calm ? 5000  : 6000;
  const sequenceLife = calm ? 5000  : 20000;

  whimsyTimers.current.push(
    window.setTimeout(() => {
      setPartyActive(true);
      document.body.classList.add('party-mode');
    }, partyDelay),
    window.setTimeout(() => setSplashActive(false), splashLife),
    window.setTimeout(() => {
      setPartyActive(false);
      document.body.classList.remove('party-mode');
    }, sequenceLife),
    window.setTimeout(() => setSmileyActive(true), 1500),
    window.setTimeout(() => setSmileyActive(false), splashLife),
  );
};
```

- [ ] **Step 3: Portal the smiley image**

In `Home.tsx`, in the JSX return (alongside the existing portals near the top of the return):

```tsx
{smileyActive && createPortal(
  <img src="/smileyface.png" className="whimsy-smiley" alt="" aria-hidden="true" />,
  document.body
)}
```

Place it after the existing `{partyActive && ...}` and `{splashActive && ...}` portal lines.

- [ ] **Step 4: Add smiley CSS to `Home.css`**

Append to `src/pages/Home.css`:

```css
/* ── Whimsy smiley overlay ─────────────────────────────── */
.whimsy-smiley {
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  width: auto;
  object-fit: contain;
  z-index: 9997;
  mix-blend-mode: screen;
  pointer-events: none;
  animation: smiley-enter 0.6s ease-out forwards;
}

@keyframes smiley-enter {
  from { opacity: 0; transform: translateX(60px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

`mix-blend-mode: screen` makes the black background invisible — only the white drawing shows through on top of the WhimsyOverlay.

- [ ] **Step 5: Type-check + visual check**

```
npx tsc --noEmit
```

Run `npm run dev`. Click the Y2K star (⭐ next to SRIHITH). After the text slams in, wait ~1.5s. Verify the smileyface slides in from the right side of the viewport. Verify it fades out with the text overlay.

- [ ] **Step 6: Commit**

```
git add src/pages/Home.tsx src/pages/Home.css
git commit -m "feat: show smileyface on right side 1.5s after whimsy overlay"
```

---

## Task 7: Wavy Text in Party Mode

**Files:**
- Modify: `src/components/WhimsyOverlay.css`
- Modify: `src/components/Navigation.css`

- [ ] **Step 1: Add `word-wave` keyframe and party-mode selector to `WhimsyOverlay.css`**

Append to `src/components/WhimsyOverlay.css`:

```css
/* ── Party-mode wave (flag ripple across words) ───────── */
@keyframes word-wave {
  0%   { transform: translateY(0); }
  50%  { transform: translateY(-14px); }
  100% { transform: translateY(0); }
}

body.party-mode .whimsy-word {
  animation: word-wave 0.65s ease-in-out infinite;
}

/* Staggered delay creates the flag-wave left-to-right flow */
body.party-mode .whimsy-word:nth-child(1) { animation-delay: 0s; }
body.party-mode .whimsy-word:nth-child(2) { animation-delay: 0.13s; }
body.party-mode .whimsy-word:nth-child(3) { animation-delay: 0.26s; }
body.party-mode .whimsy-word:nth-child(4) { animation-delay: 0.39s; }
body.party-mode .whimsy-word:nth-child(5) { animation-delay: 0.52s; }
```

Note: `body.party-mode` is added at 3s into the whimsy sequence (after `whimsy-slam` finishes at 0.45s + delay), so there is no animation conflict. The slam completes, then party kicks in and the wave begins.

- [ ] **Step 2: Add nav-brand wave to `Navigation.css` for terminal-triggered party mode**

Append to `src/components/Navigation.css`:

```css
/* ── Party-mode nav brand wave ─────────────────────────── */
@keyframes nav-brand-wave {
  0%   { transform: translateY(0) rotate(0deg); }
  25%  { transform: translateY(-5px) rotate(-1.5deg); }
  75%  { transform: translateY(5px) rotate(1.5deg); }
  100% { transform: translateY(0) rotate(0deg); }
}

body.party-mode .nav-brand {
  display: inline-block;
  animation: nav-brand-wave 0.8s ease-in-out infinite;
}
```

`display: inline-block` is required; `<a>` is inline by default and CSS `transform` doesn't apply to inline elements.

- [ ] **Step 3: Type-check**

```
npx tsc --noEmit
```

Expected: no errors (CSS changes don't affect TypeScript).

- [ ] **Step 4: Visual check — y2k path**

Run `npm run dev`. Click the Y2K star. Wait for the whimsy overlay to appear, then wait for 3s for party mode to kick in. Verify the words start rippling up and down in a wave.

- [ ] **Step 5: Visual check — terminal path**

Double-click the terminal. Type `party mode` and Enter. Verify the nav brand "SJ.SYS" starts waving.

- [ ] **Step 6: Commit**

```
git add src/components/WhimsyOverlay.css src/components/Navigation.css
git commit -m "feat: wavy flag animation on text during party mode"
```

---

## Completion Checklist

- [ ] Terminal expand: `▸ Expand` / `▸ Collapse` button on single-line command output
- [ ] Terminal 404: typing `404` navigates to KERNEL PANIC page
- [ ] SJ glow: clicking "SJ" in bio glows S and J in header for ~1.8s
- [ ] Smileyface: appears on right side 1.5s into whimsy sequence, screen-blended
- [ ] Party wave: words ripple during party mode (both y2k and terminal paths)
- [ ] `npx tsc --noEmit` passes after all tasks
- [ ] All 6 commits pushed
