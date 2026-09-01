---
name: verify-visual
description: Use when changing CSS, layout, or component markup on this site and the change is supposed to look identical — refactors, file splits, extractions, renames, dead-rule removal. Captures every route in both themes at three widths and diffs against a stored baseline. Also use when asked whether a change altered the site's appearance.
---

# Verifying a change looks identical

This site has no tests. `scripts/visual.mjs` is the substitute: 13 routes × 2
themes × 3 widths = 78 full-page screenshots, diffed pixel by pixel against a
baseline captured before the change.

## The procedure

Baseline **first**, before touching anything. A baseline taken after the edit
proves nothing.

```bash
npm run build && npx vite preview --port 4173   # leave running in one terminal

node scripts/visual.mjs baseline                # BEFORE the change
# ...make the change...
npm run build                                   # REBUILD — see below
node scripts/visual.mjs check                   # AFTER
```

Two things reliably go wrong:

- **Run it against a build, never `npm run dev`.** The dev server transforms
  modules on demand, so the first loads of a run render differently from the
  later ones. `vite preview` serves a static artifact, and it is what deploys.
- **Rebuild between the change and the check**, or you photograph the previous
  build and get a meaningless pass.

## Reading the result

`IDENTICAL — 78 shots, zero differing pixels.` is the only clean outcome.

On failure each line is either a pixel count with a bounding box, or a size
change. `scripts/visual/diff/` gets a diff image per same-size mismatch;
**size mismatches produce no diff image**, because there is nothing to overlay.

`scripts/visual/{baseline,current}/metrics.json` records `body`, `nav`,
`navLinks`, `mobileRow`, `headerBox` and `brand` heights per shot. Diff those
first — a drift there names the element that moved, where a screenshot only
says that something did.

## If a check drifts

A drift is not automatically your change. Work out whether it *can* be, before
touching anything:

**Scope.** If the drift hits routes your change cannot affect — a `Home.css`
edit moving `/blog/performative` — it is not your change. Everything shared
lives in the nav and the footer, both of which are on every page.

**Metrics.** `scripts/visual/{baseline,current}/metrics.json` records `body`,
`nav`, `navLinks`, `mobileRow`, `headerBox` and `brand` per shot. Diff those
first. A `body` that moved while every measured element held means the cause is
something not in that list — which is how the footer's webring logo was finally
identified after several wrong guesses at the nav.

**Shape.** A uniform delta repeated across many routes is environmental. A
handful of shots differing by scattered pixel counts is usually real.

The one long-running artefact — a 35px shift appearing in a contiguous prefix
of a run — was the webring logo loading from the network, and is fixed. If
something with that shape returns, suspect a newly added external asset before
suspecting your own CSS.

## What is deliberately not covered

- the first-visit terminal nudge, and the boot sequence — both pinned to the
  returning-visitor state so they hold still
- anything whose final appearance is produced *by* an animation, since all
  animations are frozen at their first frame
- the Spotify iframe on `/media`, replaced by a blank frame of equal size

Read the header comment in `scripts/visual.mjs` before trusting a result. Almost
all of that file is determinism work, and it documents what each measure pins
and why.
