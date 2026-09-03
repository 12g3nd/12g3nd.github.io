// Real HTML entry files per route, written at build time.
//
// The problem this solves: this site is a client-rendered SPA, so every URL
// used to serve the same index.html — one title, one description, and a
// canonical tag that said `https://www.jarabana.com` no matter how deep the
// page. useDocumentMeta() fixes the document *after* React runs, which is fine
// for browsers and JS-executing crawlers and useless for the social scrapers
// that fetch a URL, read the head, and never run a line of script. Sharing
// /blog/whats-a-god-to-a-non-believer produced the generic homepage card, and
// every page in the archive claimed the homepage as its canonical URL.
//
// The fix doesn't need SSR or a framework change: after Vite writes dist/, this
// copies index.html once per route and rewrites the head — title, description,
// canonical, OG, Twitter, and a BlogPosting JSON-LD block for transmissions.
// The same SPA boots underneath, so behaviour is unchanged; the difference is
// only in what a scraper sees before any JS runs.
//
// GitHub Pages serves dist/blog/<slug>/index.html for /blog/<slug>, so these
// files are hit directly and public/404.html's SPA redirect stops being
// involved for any route prerendered here.
//
// Poems get the same treatment as transmissions. Until they had their own
// routes the whole collection was a single URL, so the one piece here that has
// actually won something could not be linked, shared or scraped on its own.

import type { Plugin } from 'vite';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { SITE, staticRoutes } from '../src/data/routeMeta';
import { posts, transmissionOf } from '../src/data/posts';
import { pageOf, poems } from '../src/data/poems';

type Route = {
  /** Route path, no trailing slash except the root. */
  path: string;
  title: string;
  description: string;
  /** Absolute URL of this route's social card. */
  image: string;
  imageAlt: string;
  /** `article` for transmissions, `website` for everything else. */
  ogType: 'website' | 'article';
  /** Emitted as a <script type="application/ld+json"> block when present. */
  jsonLd?: Record<string, unknown>;
};

const DEFAULT_CARD = '/og-card.png';
const DEFAULT_CARD_ALT =
  "SJ.SYS — Srihith Jarabana. Businessman by craft. Builds things he probably shouldn't be able to.";

/** Escape for an HTML attribute value. */
function attr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escape for an HTML text node (the <title>). */
function text(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Replace one tag's content, loudly.
 *
 * A silent miss here would ship a page whose canonical URL still points at the
 * homepage — exactly the bug this plugin exists to fix — so a pattern that
 * stops matching (because index.html was edited) fails the build instead.
 */
function sub(html: string, pattern: RegExp, replacement: string, label: string): string {
  if (!pattern.test(html)) {
    throw new Error(
      `[prerender] no <${label}> tag matched in index.html — the head changed shape, ` +
        `so prerendered metadata would be silently wrong. Update scripts/prerenderPlugin.ts.`
    );
  }
  return html.replace(pattern, replacement);
}

function renderHead(html: string, route: Route): string {
  // Every prerendered route is served as <path>/index.html, and the host 301s
  // the slashless form to the trailing slash. A canonical that names the
  // redirecting URL points search engines at a hop rather than at the page, so
  // the trailing slash is part of the canonical URL for everything but root.
  const url = route.path === '/' ? SITE : `${SITE}${route.path}/`;

  let out = html;
  out = sub(out, /<title>[\s\S]*?<\/title>/, `<title>${text(route.title)}</title>`, 'title');
  out = sub(
    out,
    /<meta name="description" content="[^"]*"\s*\/>/,
    `<meta name="description" content="${attr(route.description)}" />`,
    'meta name=description'
  );
  out = sub(
    out,
    /<meta property="og:title" content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${attr(route.title)}" />`,
    'meta og:title'
  );
  out = sub(
    out,
    /<meta property="og:description" content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${attr(route.description)}" />`,
    'meta og:description'
  );
  out = sub(
    out,
    /<meta property="og:type" content="[^"]*"\s*\/>/,
    `<meta property="og:type" content="${route.ogType}" />`,
    'meta og:type'
  );
  out = sub(
    out,
    /<meta property="og:url" content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${attr(url)}" />`,
    'meta og:url'
  );
  out = sub(
    out,
    /<meta property="og:image" content="[^"]*"\s*\/>/,
    `<meta property="og:image" content="${attr(SITE + route.image)}" />`,
    'meta og:image'
  );
  out = sub(
    out,
    /<meta property="og:image:alt" content="[^"]*"\s*\/>/,
    `<meta property="og:image:alt" content="${attr(route.imageAlt)}" />`,
    'meta og:image:alt'
  );
  out = sub(
    out,
    /<meta name="twitter:title" content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${attr(route.title)}" />`,
    'meta twitter:title'
  );
  out = sub(
    out,
    /<meta name="twitter:description" content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${attr(route.description)}" />`,
    'meta twitter:description'
  );
  out = sub(
    out,
    /<meta name="twitter:image" content="[^"]*"\s*\/>/,
    `<meta name="twitter:image" content="${attr(SITE + route.image)}" />`,
    'meta twitter:image'
  );
  out = sub(
    out,
    /<meta name="twitter:image:alt" content="[^"]*"\s*\/>/,
    `<meta name="twitter:image:alt" content="${attr(route.imageAlt)}" />`,
    'meta twitter:image:alt'
  );
  out = sub(
    out,
    /<link rel="canonical" href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${attr(url)}" />`,
    'link rel=canonical'
  );

  if (route.jsonLd) {
    // `</script>` inside JSON would close this block early; nothing in a post
    // abstract should contain it, but escaping costs one replace.
    const json = JSON.stringify(route.jsonLd, null, 2).replace(/</g, '\\u003c');
    out = out.replace(
      '</head>',
      `  <script type="application/ld+json">\n${json}\n    </script>\n  </head>`
    );
  }

  return out;
}

export default function prerenderPlugin(): Plugin {
  let outDir = 'dist';

  return {
    name: 'sjsys-prerender',
    apply: 'build',

    configResolved(config) {
      outDir = config.build.outDir;
    },

    async writeBundle() {
      const root = path.resolve(outDir);
      const shell = await readFile(path.join(root, 'index.html'), 'utf8');

      // Per-post cards are generated separately (scripts/capture-og-cards.mjs)
      // and committed, so a post without one falls back to the site card rather
      // than pointing at a 404.
      const cardFor = async (slug: string) => {
        const rel = `/og/${slug}.png`;
        try {
          await access(path.join(root, 'og', `${slug}.png`));
          return rel;
        } catch {
          return DEFAULT_CARD;
        }
      };

      const routes: Route[] = staticRoutes.map((r) => ({
        path: r.path,
        title: r.title,
        description: r.description,
        image: DEFAULT_CARD,
        imageAlt: DEFAULT_CARD_ALT,
        ogType: 'website',
      }));

      // Poems. `CreativeWork` rather than `BlogPosting`: this is a poem in a
      // collection, and `isPartOf` is what says which collection.
      for (const poem of poems) {
        const url = `${SITE}/poetry/${poem.slug}/`;
        const image = await cardFor(poem.slug);
        routes.push({
          path: `/poetry/${poem.slug}`,
          title: `${poem.title} // Srihith Jarabana`,
          description: poem.blurb,
          image,
          imageAlt: `${poem.title} — a poem by Srihith Jarabana`,
          ogType: 'article',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            '@id': url,
            name: poem.title,
            headline: poem.title,
            description: poem.blurb,
            genre: 'Poetry',
            datePublished: poem.date,
            url,
            mainEntityOfPage: { '@type': 'WebPage', '@id': url },
            image: SITE + image,
            author: { '@type': 'Person', name: 'Srihith Jarabana', url: SITE },
            position: pageOf(poem.slug),
            isPartOf: {
              '@type': 'Collection',
              name: 'Selected Poems',
              url: `${SITE}/poetry`,
            },
            // Only present where there is one — an empty award key would claim
            // a distinction the poem does not hold.
            ...(poem.award ? { award: poem.award } : {}),
          },
        });
      }

      for (const post of posts) {
        const url = `${SITE}/blog/${post.slug}/`;
        const image = await cardFor(post.slug);
        routes.push({
          path: `/blog/${post.slug}`,
          title: `${post.title} // Srihith Jarabana`,
          description: post.abstract,
          image,
          imageAlt: `${transmissionOf(post.slug)} — ${post.title}`,
          ogType: 'article',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.abstract,
            // Posts carry a date but no time; the archive is append-only, so
            // published and modified are the same instant by design.
            datePublished: post.date,
            dateModified: post.date,
            url,
            mainEntityOfPage: { '@type': 'WebPage', '@id': url },
            image: SITE + image,
            author: { '@type': 'Person', name: 'Srihith Jarabana', url: SITE },
            publisher: { '@type': 'Person', name: 'Srihith Jarabana', url: SITE },
            isPartOf: {
              '@type': 'Blog',
              name: 'Transmissions',
              url: `${SITE}/blog`,
            },
          },
        });
      }

      for (const route of routes) {
        const html = renderHead(shell, route);
        // '/' overwrites dist/index.html itself, which is the point: the
        // homepage's metadata then comes from routeMeta like everything else.
        const dir = route.path === '/' ? root : path.join(root, route.path);
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, 'index.html'), html, 'utf8');
      }

      console.log(
        `[prerender] ${routes.length} routes ` +
          `(${posts.length} transmissions, ${poems.length} poems)`
      );
    },
  };
}
