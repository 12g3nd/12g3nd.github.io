# AGENTS.md

Working notes for agents editing this repo. `CLAUDE.md` points here; this file
is the source of truth, so add things here rather than there.

This is a personal site — one author, deployed straight from `main`. There is no
review step to catch a mistake before it is live, which is what most of the
rules below are about.

## Commands

```bash
npm run dev             # Vite dev server
npm run build           # tsc -b && vite build  (typecheck is part of the build)
npm run lint            # eslint; CI runs this before building
npm run preview         # serve the built site from dist/
```

CI runs `npm ci`, `npm run lint`, `npm run build`, and publishes `dist/` to
GitHub Pages. A push to `main` deploys. There is no staging.

## Invariants

These are the things that are load-bearing and not obvious from the file you
happen to be editing. Breaking one usually fails silently.

**`src/data/routeMeta.ts` has two consumers and they must not drift.** The
pages read it through `useDocumentMeta()` at runtime; `scripts/prerenderPlugin.ts`
bakes the same values into a real HTML file per route at build time. The second
one exists so a social scraper that never runs JS sees the route's own card
instead of the homepage's. Change the shape of one and the other must follow.

**`src/data/posts.ts` is the single source for every transmission.** The feed
(`scripts/feedPlugin.ts`), the archive page, the prerendered per-post HTML, and
the OG cards all read from it. A post that exists as an `.mdx` file but not here
is invisible to all four.

**Plugin order in `vite.config.ts` is not arbitrary.** MDX must run with
`enforce: 'pre'` so the JSX it emits reaches `@vitejs/plugin-react`, and
`prerenderPlugin()` must come last because it rewrites the HTML Vite has already
emitted.

**`src/utils/theme.ts` duplicates literals in `src/main.tsx` on purpose.** The
theme class is applied before first paint to avoid a flash, which means
`main.tsx` cannot import the helper it would otherwise use. If you change the
storage key or the class name, change both.

**`scripts/letterboxd.cache.json` is committed on purpose.** `letterboxdPlugin`
fetches the ratings at build time and falls back to this file when the feed is
unreachable, so a third party being down does not silently empty `/media`. Do
not "clean it up".

**`.impeccable/config.json` is committed on purpose too.** It records *why* a
design-lint rule is suppressed. Deleting it loses the reasoning, not just the
suppression.

**The visit counter only writes from the live site.** `COUNTING_HOSTS` in
`src/components/VisitorCounter.tsx` gates the POST on hostname, so local
development reads the number without inflating it. Anything that captures pages
in a browser must not defeat that gate.

**`worker/` is a separate npm project** with its own `package.json` and
lockfile, deployed by hand with wrangler — see `worker/DEPLOY.md`. It holds the
guestbook entries and the visit count in D1. Nothing in the site build touches
it, and a mistake there loses real data.

## Changing anything visual

The site has no tests. What it has instead is `scripts/visual.mjs`, which
screenshots all 13 routes in both themes at three widths and diffs the result
against a stored baseline.

```bash
npm run build && npx vite preview --port 4173   # in one terminal
node scripts/visual.mjs baseline                # before your change
# ...edit, then rebuild...
node scripts/visual.mjs check                   # after
```

Run it against a **built** site, never `npm run dev` — the dev server transforms
modules on demand and the first loads of a run render differently from the later
ones. Rebuild before every check, or you are photographing the previous build.

Read the header of that file before trusting it. Getting it repeatable took
pinning the clock, `Math.random`, five storage keys, every CSS animation, the
Worker responses and the webfonts, and two things are deliberately **not**
covered: the first-visit nudge state, and the boot sequence.

## Style

Comments here explain *why*, not *what* — see `src/data/routeMeta.ts` or
`.github/workflows/deploy.yml` for the register. Match it. A comment restating
the code is worse than none; a comment recording a constraint someone would
otherwise trip over is the point.

Commit messages are lowercase conventional prefixes (`feat:`, `fix:`, `chore:`,
`ci:`, `style:`) with a body explaining the reasoning when there is any.
