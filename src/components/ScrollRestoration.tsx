import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/** Ceiling on how long we keep waiting for an incoming page to grow tall enough. */
const RESTORE_BUDGET_MS = 1000;
const STORAGE_KEY = 'sjsys_scroll_positions';

type Positions = Record<string, number>;

function loadPositions(): Positions {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Positions) : {};
  } catch {
    return {}; // storage blocked; restoration degrades to scroll-to-top
  }
}

function savePositions(positions: Positions) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch { /* not worth breaking a navigation over */ }
}

function maxScroll() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

/**
 * Scroll position per history entry: the top of the page on a new navigation,
 * and the offset you left behind when you go back or forward to one you have
 * already seen.
 *
 * Not react-router's `<ScrollRestoration>`, which only exists for data routers
 * and would need `createBrowserRouter` in place of `<BrowserRouter>`.
 *
 * The router swaps the route without reloading the document, so without this
 * the offset simply survived into the new page — opening a transmission from
 * halfway down /blog opened the post halfway down too, and the browser's scroll
 * anchoring then nudged it somewhere else again as the new page laid out at a
 * different height. Leaving `POP` to the browser is not an alternative: it
 * restores at popstate, which on a client-rendered site is before React has
 * rendered the route, so it clamps the offset against a near-empty document.
 * Measured, that put a return to /projects at 2772 instead of 2417, and on
 * another probe at 0.
 *
 * Three things here are load-bearing:
 *
 * `behavior: 'instant'`. `html` sets `scroll-behavior: smooth` for in-page
 * jumps, and a bare `scrollTo` inherits it — the page would animate its way up
 * while PageTransition is cross-fading, and the incoming page could mount
 * mid-flight and be seen scrolling itself to the top.
 *
 * The wait before a restore. `AnimatePresence mode="wait"` holds the outgoing
 * page for its 300ms exit before the incoming one mounts, so restoring on the
 * location change applies the offset against the *old* page's height: asking
 * for 2417 while a short post is still up lands at ~700 and stays there. So a
 * restore polls on rAF until the document can actually reach the target, and
 * scrolls once. Nothing is scrolled while it waits, which is also why the
 * outgoing page is not seen jumping. Overshoot needs no handling — when the
 * document shrinks under the current offset the browser clamps it for us, so a
 * return to a page that is now shorter is already sitting where the budget
 * would put it.
 *
 * Positions are keyed on `location.key`, which the router keeps in
 * `history.state`, so they survive a reload — hence sessionStorage rather than
 * a module-level map. A key with no recorded offset means an entry from before
 * this tab's history, and the answer for it is the top of the page.
 */
export default function ScrollRestoration() {
  const { key } = useLocation();
  const navigationType = useNavigationType();

  const positions = useRef<Positions>(null!);
  if (positions.current === null) positions.current = loadPositions();

  const currentKey = useRef(key);
  const offset = useRef(0);
  const firstRender = useRef(true);

  // The live offset of whichever entry is on screen. Read on navigation, where
  // it is still the outgoing page's, and written back under that page's key.
  useEffect(() => {
    const onScroll = () => { offset.current = window.scrollY; };
    const park = () => {
      positions.current[currentKey.current] = offset.current;
      savePositions(positions.current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    // A reload or a tab close is the one exit that never runs the effect below.
    window.addEventListener('pagehide', park);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', park);
    };
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      currentKey.current = key;
      return;
    }

    positions.current[currentKey.current] = offset.current;
    currentKey.current = key;
    savePositions(positions.current);

    const target = navigationType === 'POP' ? positions.current[key] ?? 0 : 0;

    if (target === 0) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      offset.current = 0;
      return;
    }

    let frame = 0;
    let done = false;
    const deadline = performance.now() + RESTORE_BUDGET_MS;

    // Someone who starts scrolling while we are waiting has said where they
    // want to be, and it is not our business to overrule them.
    const abandon = () => { done = true; };
    window.addEventListener('wheel', abandon, { passive: true });
    window.addEventListener('touchstart', abandon, { passive: true });
    window.addEventListener('keydown', abandon);

    const step = () => {
      if (done) return;
      if (maxScroll() >= target || performance.now() >= deadline) {
        window.scrollTo({ top: Math.min(target, maxScroll()), left: 0, behavior: 'instant' });
        offset.current = window.scrollY;
        return;
      }
      frame = requestAnimationFrame(step);
    };
    step();

    return () => {
      done = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('wheel', abandon);
      window.removeEventListener('touchstart', abandon);
      window.removeEventListener('keydown', abandon);
    };
  }, [key, navigationType]);

  return null;
}
