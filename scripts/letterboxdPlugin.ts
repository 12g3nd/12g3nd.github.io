// Letterboxd ratings, fetched at build time.
//
// Same reasoning as feedPlugin.ts: this site is a client-rendered SPA, and the
// Letterboxd RSS feed sends no CORS headers, so the browser can never fetch it
// itself. The data has to be baked in before deploy, which makes this a Vite
// plugin rather than a hook — it fetches once per build and hands the result to
// the Media page through a virtual module.
//
// Freshness therefore equals deploy cadence, which is why .github/workflows
// carries a nightly scheduled rebuild. The page renders ratings rather than
// watch dates, so a build that is a day behind never claims to be live.
//
// A failed fetch must not fail the build — a personal site should still deploy
// when a third party is down. On success the response is written to a cache
// file next to this one; on failure that cache is used instead, and if there is
// no cache either, the page simply renders no Letterboxd plate.

import type { Plugin } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const FEED_URL = 'https://letterboxd.com/solder/rss/';
const VIRTUAL_ID = 'virtual:letterboxd';
const RESOLVED_ID = '\0' + VIRTUAL_ID;
const CACHE_FILE = path.resolve('scripts', 'letterboxd.cache.json');

/** Letterboxd rates in halves, 0.5–5.0. */
export type Film = {
  title: string;
  year: string;
  /** Numeric rating, kept for sorting. */
  rating: number;
  /** Pre-rendered ★/½ string — the component stays dumb. */
  stars: string;
  link: string;
  poster: string | null;
  liked: boolean;
};

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? m[1].trim() : null;
}

/** 4.5 -> "★★★★½". Letterboxd's own notation, so it needs no legend. */
function toStars(rating: number): string {
  const full = Math.floor(rating);
  return '★'.repeat(full) + (rating - full >= 0.5 ? '½' : '');
}

/**
 * Minimal RSS reader. The feed is small, machine-generated and stable, and the
 * alternative is adding an XML parser to the dependency tree to read four
 * fields off one document.
 */
function parse(xml: string): Film[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

  return items
    .map((block): Film | null => {
      const title = tag(block, 'letterboxd:filmTitle');
      const rawRating = tag(block, 'letterboxd:memberRating');
      const link = tag(block, 'link');

      // Unrated log entries are watch history, not an opinion — the wall is
      // built out of ratings, so anything without one is dropped.
      if (!title || !rawRating || !link) return null;

      const rating = Number(rawRating);
      if (!Number.isFinite(rating)) return null;

      // The poster lives in the CDATA description as the first <img>.
      const poster = block.match(/<img src="([^"]+)"/)?.[1] ?? null;

      return {
        title: decodeEntities(title),
        year: tag(block, 'letterboxd:filmYear') ?? '',
        rating,
        stars: toStars(rating),
        link,
        poster,
        liked: tag(block, 'letterboxd:memberLike') === 'Yes',
      };
    })
    .filter((f): f is Film => f !== null)
    .sort((a, b) => b.rating - a.rating);
}

/** The feed escapes apostrophes in titles; nothing else shows up in practice. */
function decodeEntities(s: string): string {
  return s
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

async function load(): Promise<Film[]> {
  try {
    const res = await fetch(FEED_URL, {
      headers: { 'User-Agent': 'jarabana.com build (letterboxdPlugin)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const films = parse(await res.text());
    if (!films.length) throw new Error('feed had no rated films');

    await writeFile(CACHE_FILE, JSON.stringify(films, null, 2) + '\n', 'utf8');
    console.log(`[letterboxd] ${films.length} rated films`);
    return films;
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err);
    try {
      const cached: Film[] = JSON.parse(await readFile(CACHE_FILE, 'utf8'));
      console.warn(`[letterboxd] fetch failed (${why}) — using ${cached.length} cached films`);
      return cached;
    } catch {
      console.warn(`[letterboxd] fetch failed (${why}) and no cache — rendering no films`);
      return [];
    }
  }
}

export default function letterboxdPlugin(): Plugin {
  let films: Film[] = [];

  return {
    name: 'sjsys-letterboxd',

    async buildStart() {
      films = await load();
    },

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },

    load(id) {
      if (id !== RESOLVED_ID) return null;
      return `export const films = ${JSON.stringify(films)};`;
    },
  };
}
