import { useEffect } from 'react';
import { preloadPostBody } from '../data/postBodies';

type Connection = { saveData?: boolean };

/**
 * Fetches a transmission's body as soon as a link to it is hovered, focused or
 * touched, so splitting the bodies out of the bundle does not make opening one
 * slower than it used to be.
 *
 * A body is only requested once its post renders, and the post only renders
 * after the outgoing page's 300ms exit — so without this every click would pay
 * for a round trip the single bundle never did. The gap between pointing at a
 * link and the new page mounting is usually longer than the fetch.
 *
 * One listener on the document rather than one per link: post links live in the
 * archive, the sitemap, the home page and the prev/next rail of a post, and
 * this covers all of them plus whatever links to a post next. Skipped under
 * Save-Data, where a visitor has asked for exactly this not to happen.
 */
export default function usePostPrefetch() {
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    if (connection?.saveData) return;

    const onIntent = (event: Event) => {
      const link = (event.target as Element | null)?.closest?.('a[href]');
      if (!(link instanceof HTMLAnchorElement) || link.origin !== window.location.origin) return;
      preloadPostBody(link.pathname).catch(() => {});
    };

    document.addEventListener('pointerover', onIntent, { passive: true });
    document.addEventListener('touchstart', onIntent, { passive: true });
    document.addEventListener('focusin', onIntent);
    return () => {
      document.removeEventListener('pointerover', onIntent);
      document.removeEventListener('touchstart', onIntent);
      document.removeEventListener('focusin', onIntent);
    };
  }, []);
}
