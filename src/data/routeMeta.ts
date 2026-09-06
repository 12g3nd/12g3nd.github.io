/**
 * Per-route title and description, in one place.
 *
 * Two consumers read this, and they must not drift:
 *   - the pages, through useDocumentMeta(), which updates the live document
 *   - scripts/prerenderPlugin.ts, which bakes the same values into a real HTML
 *     file per route at build time, so a social scraper that never runs JS sees
 *     the route's own card instead of the homepage's
 *
 * Blog posts and poems aren't listed here — their metadata comes from
 * src/data/posts.ts and src/data/poems.tsx, which are already the one source
 * for the feed, the archive and the collection.
 */

/** Origin, no trailing slash. Every canonical/OG URL must be absolute. */
export const SITE = 'https://www.jarabana.com';

export type RouteMeta = {
  /** Path as routed, no trailing slash (except the root). */
  path: string;
  title: string;
  description: string;
};

export const routeMeta = {
  home: {
    path: '/',
    title: 'Srihith Jarabana',
    description:
      "Srihith Jarabana's personal corner of the internet — projects, writing, poetry, and the things that make up a worldview.",
  },
  projects: {
    path: '/projects',
    title: 'Projects // Srihith Jarabana',
    description:
      'Things Srihith Jarabana has built — personal projects, the FI99 studio, and a viral Snapchat lens.',
  },
  business: {
    path: '/business',
    title: 'Business // Srihith Jarabana',
    description:
      'The business and finance side of Srihith Jarabana (research experience, competition track record, and investment write-ups).',
  },
  media: {
    path: '/media',
    title: 'Media // Srihith Jarabana',
    description:
      'Books, poetry, albums, films, and games Srihith Jarabana enjoys — plus current playlists and Letterboxd ratings.',
  },
  poetry: {
    path: '/poetry',
    title: 'Poetry // Srihith Jarabana',
    description: 'A selection of poems Srihith Jarabana has written, including award-winning work.',
  },
  blog: {
    path: '/blog',
    title: 'Transmissions // Srihith Jarabana',
    description: 'Essays and logs by Srihith Jarabana on ambition, design, and whatever else.',
  },
  guestbook: {
    path: '/guestbook',
    title: 'Guestbook // Srihith Jarabana',
    description:
      "Visitors who've signed Srihith Jarabana's guestbook (drawn signatures and three words each).",
  },
  sitemap: {
    path: '/sitemap',
    title: 'Index of / // Srihith Jarabana',
    description:
      'Every page on this site, listed the way a web server would have told you about it.',
  },
} as const satisfies Record<string, RouteMeta>;

/** Every static route, for the prerenderer to walk. */
export const staticRoutes: readonly RouteMeta[] = Object.values(routeMeta);
