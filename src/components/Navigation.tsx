import { NavLink } from 'react-router-dom';
import { useState, useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import ScrambleText from './ScrambleText';
import MatrixRain from './MatrixRain';
import PartyOverlay from './PartyOverlay';
import useTerminal from './terminal/useTerminal';
import TerminalBody from './terminal/TerminalBody';
import NavUtils from './NavUtils';
import './Navigation.css';

/**
 * The pages, each on its own line colour, the way a transit map colours its
 * lines: Toronto's subway lines for the first four (it is the TSJ's terminus),
 * the TSJ's own red for TRAVEL, Line 6's silver for GUESTBOOK, and the site's
 * cyan for BLOG. `onLine` is the text colour that reads on a full fill of it.
 */
const PAGES = [
  { to: '/business', label: 'BUSINESS', line: 'var(--line-business)', onLine: 'var(--on-line-dark)' },
  { to: '/projects', label: 'PROJECTS', line: 'var(--line-projects)', onLine: 'var(--on-line-dark)' },
  { to: '/poetry', label: 'POETRY', line: 'var(--line-poetry)', onLine: 'var(--on-line-light)' },
  { to: '/media', label: 'MEDIA', line: 'var(--line-media)', onLine: 'var(--on-line-dark)' },
  { to: '/travel', label: 'TRAVEL', line: 'var(--line-travel)', onLine: 'var(--on-line-dark)' },
  { to: '/guestbook', label: 'GUESTBOOK', line: 'var(--line-guestbook)', onLine: 'var(--on-line-dark)' },
  { to: '/blog', label: 'BLOG', line: 'var(--line-blog)', onLine: 'var(--on-line-dark)' },
] as const;

// The brand cycles through these on a triple-click, laid over the logo, then
// clears back to it.
const BRAND_GLITCH = ['SRIHITH.EXE', 'SJARABANA.OS', 'BUSINESSMAN.EXE', "SJ'S WORLD"];
const BRAND_STEP = 650; // ms per glitch frame

/**
 * The nav bar: a wordmark, the terminal, and seven links.
 *
 * The terminal is most of what this bar does and none of what it is, so it
 * lives in ./terminal — the state and interpreter in useTerminal, the markup in
 * TerminalBody, the command tables in terminal.data. What is left here is the
 * bar itself, plus the wordmark's glitch, which is genuinely local to it.
 *
 * The terminal renders in two places: the header box, which the desktop layout
 * shows, and the row below the nav, which the mobile layout shows. Only one is
 * visible at a time (Navigation.css decides which), and both read the same
 * useTerminal, so opening the command line in one opens it in both.
 */
export default function Navigation() {
  const t = useTerminal();

  const [brand, setBrand] = useState("SJ'S WORLD");
  const [brandGlitch, setBrandGlitch] = useState(false);
  const brandTimers = useRef<number[]>([]);
  const longPressTimer = useRef(0);
  const longPressFired = useRef(false);
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);

  // Triple-click the wordmark: scramble through alternate OS names, then settle.
  const glitchBrand = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    brandTimers.current.forEach((timer) => clearTimeout(timer));
    brandTimers.current = [];
    setBrandGlitch(true);
    BRAND_GLITCH.forEach((label, i) => {
      brandTimers.current.push(
        window.setTimeout(() => setBrand(label), i * BRAND_STEP)
      );
    });
    brandTimers.current.push(
      window.setTimeout(() => setBrandGlitch(false), BRAND_GLITCH.length * BRAND_STEP + 300)
    );
  };

  // ── Long-press the wordmark (touch) → same glitch as the desktop triple-click.
  const LONG_PRESS_MS = 450;
  const startBrandPress = (e: ReactPointerEvent<HTMLAnchorElement>) => {
    pressOrigin.current = { x: e.clientX, y: e.clientY };
    longPressFired.current = false;
    window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      glitchBrand();
    }, LONG_PRESS_MS);
  };
  const cancelBrandPress = () => window.clearTimeout(longPressTimer.current);
  // Any real movement means a scroll/drag started here, not a press — bail.
  const moveBrandPress = (e: ReactPointerEvent<HTMLAnchorElement>) => {
    const o = pressOrigin.current;
    if (o && Math.hypot(e.clientX - o.x, e.clientY - o.y) > 10) cancelBrandPress();
  };

  useEffect(
    () => () => {
      brandTimers.current.forEach((timer) => clearTimeout(timer));
      window.clearTimeout(longPressTimer.current);
    },
    []
  );

  // Shared by both terminal mount points, so the two rows stay in lockstep.
  const terminalState = `${t.commandMode ? ' terminal-header-box--active' : ''}${t.block ? ' terminal-header-box--multiline' : ''}${t.nudge ? ' terminal-nudge' : ''}`;

  return (
    <>
      {t.matrix && <MatrixRain />}
      {t.party && <PartyOverlay />}
      <nav className="brutalist-nav">
        <NavLink
          to="/"
          className="nav-brand"
          onPointerDown={startBrandPress}
          onPointerMove={moveBrandPress}
          onPointerUp={cancelBrandPress}
          onPointerLeave={cancelBrandPress}
          onPointerCancel={cancelBrandPress}
          onContextMenu={(e) => e.preventDefault()}
          onClick={(e) => {
            // Long-press (touch) or triple-click (mouse) glitches the wordmark
            // instead of navigating home.
            if (longPressFired.current) {
              e.preventDefault();
              longPressFired.current = false;
              return;
            }
            if (e.detail === 3) {
              e.preventDefault();
              glitchBrand();
            }
          }}
        >
          <img
            className="nav-brand__logo"
            src="/sj-world.png"
            srcSet="/sj-world.png 1x, /sj-world@2x.png 2x"
            width="104"
            height="80"
            alt="SJ's World — home"
            draggable={false}
          />
          {/* The logo printed in metal: the PNG's alpha as a mask over a
              brushed-steel gradient. The img stays for its size and its alt. */}
          <span className="nav-brand__metal" aria-hidden="true" />
          {brandGlitch && (
            <span className="nav-brand__glitch" aria-hidden="true"><ScrambleText text={brand} /></span>
          )}
        </NavLink>

        <div
          className={`terminal-header-box${terminalState}`}
          onDoubleClick={t.openCommandMode}
          title="Double-click to enter a command"
        >
          <TerminalBody t={t} />
        </div>

        <div className="nav-links">
          {PAGES.map((p) => (
            <NavLink
              key={p.to}
              to={p.to}
              style={{ '--line': p.line, '--on-line': p.onLine } as CSSProperties}
            >
              <span className="nav-label">{p.label}</span>
            </NavLink>
          ))}
        </div>

        <NavUtils placement="bar" />
      </nav>

      <div
        className={`terminal-mobile-row${terminalState}`}
        onClick={() => { if (!t.commandMode) t.openCommandMode(); }}
      >
        <TerminalBody t={t} />
        {!t.commandMode && (
          <span className="terminal-mobile-hint" aria-hidden="true">
            {t.nudge ? '▸ tap & type `help`' : '▸ tap to type'}
          </span>
        )}
        <NavUtils placement="row" />
      </div>
    </>
  );
}
