import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Puts every in-app navigation back at the top of the page.
 *
 * The router swaps the route without reloading the document, so the scroll
 * offset survived the change: opening a transmission from halfway down /blog
 * opened the post halfway down too — or wherever the browser's scroll
 * anchoring dragged it once the new page laid out at a different height,
 * which could be further down than where you started. Every route was
 * affected; three call sites had grown their own `window.scrollTo` to paper
 * over it, and everything reached by a plain <Link> was still broken.
 *
 * `behavior: 'instant'` is load-bearing. `html` sets `scroll-behavior: smooth`
 * for in-page jumps, and a bare scrollTo(0, 0) inherits it — the page would
 * animate its way up while PageTransition is cross-fading, and the new page
 * could mount mid-flight and be seen scrolling itself to the top.
 *
 * Keyed on `location.key`, not the pathname, so navigating to the page you are
 * already on — the terminal and the command palette both allow it — still
 * returns you to the top. The first run is skipped because that one is the
 * initial load, which is the browser's to place, not ours.
 */
export default function ScrollToTop() {
  const { key } = useLocation();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [key]);

  return null;
}
