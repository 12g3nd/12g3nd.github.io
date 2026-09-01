// RSS 2.0 feed for the transmissions, generated at build time.
//
// This site is a client-rendered SPA on GitHub Pages, so React can never serve
// /feed.xml itself — a reader that fetches the URL would get index.html with an
// empty #root, not XML. The file has to exist on disk before deploy, so this
// runs as a Vite plugin instead of a page: it imports the same
// src/data/posts.ts the Blog page renders from (one source of truth, feed and
// site can't drift) and emits dist/feed.xml as part of `npm run build`.
//
// In dev the same bytes are served at the same path, so /feed.xml is checkable
// at localhost without a production build. Cost of the shared import: posts.ts
// becomes a config dependency, so editing it restarts the dev server rather
// than hot-reloading. Worth it for not having to parse the file.
//
// Items carry the abstract and a link, not the full essay — a post's CRT/ASCII
// presentation is half the thing, and feed-reader HTML would flatten it.

import type { Plugin } from 'vite';
import { postsSorted, type Post } from '../src/data/posts';

/** Origin, no trailing slash. Every URL in a feed must be absolute. */
const SITE = 'https://www.jarabana.com';
const FEED_PATH = 'feed.xml';

/**
 * Newest N transmissions. The archive is append-only and aimed at 100, but a
 * feed is a "what's new" window rather than the archive — 50 abstracts is a
 * generous backlog for a new subscriber and keeps the file small enough that
 * re-polling it costs nobody anything.
 */
const MAX_ITEMS = 50;

const CHANNEL_TITLE = 'Transmissions // Srihith Jarabana';
const CHANNEL_DESCRIPTION =
  'Essays and logs by Srihith Jarabana on ambition, design, and whatever else. ' +
  "Append-only — once a transmission goes out, it doesn't get edited.";

/**
 * Escape for XML text nodes. Only & < > are structurally required; " is escaped
 * too so the same helper is safe if a value ever lands in an attribute.
 */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * YYYY-MM-DD -> RFC 822, the format RSS pubDate requires.
 *
 * Posts carry a date but no time, and readers sort on this value. Anchoring at
 * midnight UTC would stamp a Toronto post to the previous evening for every
 * reader in the Americas; noon UTC lands on the intended calendar day almost
 * everywhere. toUTCString() emits the RFC 822 shape verbatim and is
 * locale-independent per spec, so no hand-rolled month table is needed.
 */
function rfc822(date: string): string {
  return new Date(`${date}T12:00:00Z`).toUTCString();
}

function itemXml(post: Post): string {
  // Trailing slash: the site serves <path>/index.html and 301s the slashless
  // form, so an unslashed <link> sends every reader through a redirect and an
  // unslashed permalink guid names a URL that never returns 200.
  const url = `${SITE}/blog/${post.slug}/`;
  return `    <item>
      <title>${esc(post.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${rfc822(post.date)}</pubDate>
      <description>${esc(post.abstract)}</description>
    </item>`;
}

function buildFeed(): string {
  const items = postsSorted.slice(0, MAX_ITEMS);

  // Deliberately the newest post's date rather than the build time: the feed is
  // then byte-identical between builds until something is actually published,
  // so ETags hold and readers polling an unchanged feed get a cheap 304 instead
  // of a fresh download every time the site is redeployed.
  const lastBuild = items.length ? rfc822(items[0].date) : new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(CHANNEL_TITLE)}</title>
    <link>${SITE}/blog/</link>
    <description>${esc(CHANNEL_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${SITE}/${FEED_PATH}" rel="self" type="application/rss+xml" />
${items.map(itemXml).join('\n')}
  </channel>
</rss>
`;
}

export default function feedPlugin(): Plugin {
  return {
    name: 'sjsys-rss-feed',

    // Build: land feed.xml at the root of dist/ next to index.html.
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: FEED_PATH, source: buildFeed() });
    },

    // Dev: intercept before Vite's SPA fallback, which would otherwise answer
    // /feed.xml with index.html. Rebuilt per request so post edits show on
    // refresh.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== `/${FEED_PATH}`) return next();
        res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
        res.end(buildFeed());
      });
    },
  };
}
