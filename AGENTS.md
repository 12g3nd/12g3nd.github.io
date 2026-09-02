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

## The map

```text
src/
  main.tsx            entry; applies the stored theme before first paint
  App.tsx             routes
  index.css           the design tokens — :root palette, fonts, borders
  styles/             CSS shared across pages, imported from main.tsx
  components/         shared UI; a component's CSS sits beside it
    terminal/         the nav bar's command line: data, hook, markup
  pages/              one component per route; its CSS beside it, or in a
                      same-named folder when one file got too big to search
    home/ projects/ guestbook/ poetry/    one file per part of the page
  content/            transmissions, as .mdx — prose only, no frontmatter
  data/               posts.ts and routeMeta.ts; each has two consumers
  hooks/ utils/ types/
scripts/              vite plugins (feed, letterboxd, prerender) and local
                      tooling (capture-*, visual.mjs, fetch-fonts.mjs) — see
                      the header of each
worker/               Cloudflare Worker: guestbook entries and the visit count
public/               static assets; og/ cards are generated and committed
```

Four pages keep their CSS in a folder rather than one file, for the same reason
in each case: the single file had grown past the point where you could search
it. Every one has an `index.css` whose `@import` order *is* the cascade — read
the comment at the top before reordering, because `poetry/` has a pair where the
order is load-bearing. `components/terminal/` is split by kind instead: tables,
state, markup.

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

**`public/fonts/` is committed, and the `@font-face` block in `index.html` is
generated.** The webfonts are self-hosted rather than loaded from Google, which
is what lets the rules be inlined in the `<head>` — the browser knows every font
URL before it leaves the head instead of waiting on a third-party stylesheet
first. Everything between the two `generated fonts` markers is rewritten
wholesale by `scripts/fetch-fonts.mjs`, so hand-edits there are lost; change the
script and re-run it. It is deliberately not part of `npm run build`, so neither
a build nor CI depends on Google being reachable. If you change which families
or weights the design uses, update the `FACES` list in `scripts/visual.mjs` too
— that is what the screenshot harness blocks on, and a face missing there is a
silent race rather than an error.

**`scripts/letterboxd.cache.json` is committed on purpose.** `letterboxdPlugin`
fetches the ratings at build time and falls back to this file when the feed is
unreachable, so a third party being down does not silently empty `/media`. Do
not "clean it up".

**`.impeccable/config.json` is committed on purpose too.** It records *why* a
design-lint rule is suppressed. Deleting it loses the reasoning, not just the
suppression.

**Most design tokens change value between themes, so a raw hex is not always
safe to "tidy up" into a `var()`.** Eleven of the fifteen colour tokens —
including `--accent-primary`, `--bg-surface` and every `--text-rgb` derivative —
are redefined under `.theme-light`. Replacing a hardcoded `#00E5FF` with
`var(--accent-primary)` therefore keeps dark mode identical and silently changes
light mode. Only `--paper-bg`, `--paper-ink`, `--paper-ink-soft` and
`--accent-warm-ink` hold one value in both themes, and no literal outside
`index.css` currently matches any of those. The remaining raw literals are
deliberate: they are colours that are meant *not* to follow the theme.

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

A full run is about three minutes.

Read the header of that file before trusting it. Getting it repeatable took
pinning the clock, `Math.random`, five storage keys, every CSS animation, the
Worker responses, the webfonts, and the footer's webring logo — that last one
is fetched from another site and sized `height: auto`, so until it was cached
locally the footer was one height when it had arrived and another when it had
not, on every page. The webring logo is now served from `public/` for everyone,
not just the harness, so that particular shift is gone from the real site too.

Images are pinned as well, and that one is easy to re-break. They are
`loading="lazy"` and they sit in boxes CSS has already sized, so an image
arriving changes nothing about the document height — `settle()` cannot see it,
and whether a picture below the fold had loaded when the shutter opened came
down to timing. It showed up as one image present in a run and absent in its
pair, in whichever direction the race fell. `ensureImages()` forces them eager
and waits.

Two things are deliberately **not** covered: the first-visit nudge state, and
the boot sequence. Both are pinned to the returning-visitor state so they hold
still, which means a change to either will not be caught.

**The harness leans on reduced motion, and it fails silently when something
ignores it.** Every route's content is wrapped in `PageTransition`, which starts
at `opacity: 0` and is animated by framer-motion on `requestAnimationFrame` —
and the harness pauses the clock before it navigates, so those frames never ran.
For a long time every shot in the set was an empty page carrying only the nav
and the footer, the two things that live outside that wrapper, and the diff
reported "78 shots, zero differing pixels" because it was comparing one blank
page against another. `PageTransition` now returns a plain div under reduced
motion, the way `Reveal` and the boot sequence already did. A new component that
animates itself in without honouring reduced motion will drop out of these shots
the same way, and the diff will stay green while it does. If a change you expect
to see does not show up as drift, open the PNG in `scripts/visual/current/`
before concluding it was invisible.

## Procedures worth following exactly

Two jobs on this repo have a step that is easy to skip and silent when skipped.
Both are written up in `.claude/skills/` — Claude Code loads them by name, and
they are plain Markdown, so read them directly otherwise.

- **`new-transmission`** — a post is an `.mdx` file *plus* a registration in
  `posts.ts` that four separate surfaces read, plus a social card generated
  locally and committed. A post missing from `posts.ts` is invisible everywhere.
- **`verify-visual`** — how to prove a change looks identical: the
  baseline-before-you-edit ordering, the rebuild step, and how to work out
  whether a drift can be your change at all.

## Style

Comments here explain *why*, not *what* — see `src/data/routeMeta.ts` or
`.github/workflows/deploy.yml` for the register. Match it. A comment restating
the code is worse than none; a comment recording a constraint someone would
otherwise trip over is the point.

Commit messages are lowercase conventional prefixes (`feat:`, `fix:`, `chore:`,
`ci:`, `style:`) with a body explaining the reasoning when there is any.
