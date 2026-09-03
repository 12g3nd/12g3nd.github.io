import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import feedPlugin from './scripts/feedPlugin'
import letterboxdPlugin from './scripts/letterboxdPlugin'
import prerenderPlugin from './scripts/prerenderPlugin'
import buildInfoPlugin from './scripts/buildInfoPlugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // MDX must run before the React plugin (enforce: 'pre') so the JSX it emits
    // is handed to @vitejs/plugin-react for the JSX transform + Fast Refresh.
    // Blog posts live in src/content/*.mdx — see src/pages/BlogPostPage.tsx.
    { enforce: 'pre', ...mdx() },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    // Emits dist/feed.xml from src/data/posts.ts, and serves it in dev.
    feedPlugin(),
    // Bakes the last commit's date into `virtual:build-info` for the footer's
    // "last updated" stamp — a real fact, rather than today's date every day.
    buildInfoPlugin(),
    // Bakes the Letterboxd ratings into `virtual:letterboxd` at build time —
    // the feed sends no CORS headers, so the browser cannot fetch it itself.
    letterboxdPlugin(),
    // Writes a real HTML file per route (and per transmission) with its own
    // title, canonical URL, OG/Twitter tags and JSON-LD, so scrapers that never
    // run JS stop seeing the homepage's card on every page. Must come last:
    // it rewrites the index.html Vite has already emitted.
    prerenderPlugin(),
  ],
  base: '/',
})
