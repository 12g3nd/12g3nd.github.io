import { NavLink } from 'react-router-dom';
import { useState, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import ScrambleText from './ScrambleText';
import MatrixRain from './MatrixRain';
import PartyOverlay from './PartyOverlay';
import useTerminal from './terminal/useTerminal';
import TerminalBody from './terminal/TerminalBody';
import './Navigation.css';

// The brand cycles through these on a triple-click, then settles back to SJ.SYS.
const BRAND_GLITCH = ['SRIHITH.SYS', 'SJARABANA.OS', 'BUSINESSMAN.EXE', 'SJ.SYS'];
const BRAND_STEP = 650; // ms per glitch frame

/**
 * The nav bar: a wordmark, the terminal, and five links.
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

  const [brand, setBrand] = useState('SJ.SYS');
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
          {brandGlitch ? <ScrambleText text={brand} /> : 'SJ.SYS'}
        </NavLink>

        <div
          className={`terminal-header-box${terminalState}`}
          onDoubleClick={t.openCommandMode}
          title="Double-click to enter a command"
        >
          <TerminalBody t={t} />
        </div>

        <div className="nav-links">
          <NavLink to="/business">BUSINESS</NavLink>
          <NavLink to="/projects">PROJECTS</NavLink>
          <NavLink to="/poetry">POETRY</NavLink>
          <NavLink to="/media">MEDIA</NavLink>
          <NavLink to="/blog">BLOG</NavLink>
        </div>
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
      </div>
    </>
  );
}
