# Whimsy Mode — design spec

**Date:** 2026-06-02
**Status:** approved

## Summary

Clicking the Y2K star (`.y2k-accent`, `/y2k1.png`) next to "SRIHITH" on the
Home hero triggers a ~20-second celebratory sequence: the star spins, the
existing party mode (rainbow recolor + confetti) fires, and a full-bleed
"LIFE NEEDS A BIT OF WHIMSY, YOU GET ME" splash takes over the screen for the
first few seconds before the party continues and then tears itself down.

This deliberately breaks the sacred cyan-on-navy palette for the duration —
that's the joke, and party mode already does it.

## Trigger

- The `.y2k-accent` `<img>` in `Home.tsx` becomes interactive:
  - remove `pointer-events: none`, add `cursor: pointer`
  - `role="button"`, `tabIndex={0}`, `aria-label`, Enter/Space keyboard handler
- Clicks are ignored while a sequence is already active (state-flag guard).

## Sequence (full-motion)

Orchestrated by a single state flag + timer in `Home.tsx` (mirrors the existing
`elevatorDropping` pattern there and App's CRT-burst timer).

| Time | Behavior |
|------|----------|
| t=0s | Star spins continuously (CSS keyframes) for the whole sequence. `body.party-mode` added → reuses existing rainbow recolor + unicorn cursor (`index.css`). `<PartyOverlay />` confetti mounts. |
| t≈0–6s | New full-bleed `WhimsyOverlay`: edge-to-edge tilted text over a strobing rainbow backdrop. Text slams in, holds, blasts out ~6s. `z-index` above confetti; `pointer-events: none`. |
| t≈6–20s | Splash gone; recolor + confetti + spinning star continue. |
| t=20s | Tear down: remove `body.party-mode`, unmount confetti, stop spin, reset state. |

## Reduced motion (calm version)

Detect `prefers-reduced-motion: reduce`. If set:
- no spin, no confetti, no strobe
- whimsy text fades in, holds statically, fades out (shorter)
- rainbow recolor still applies (already reduced-motion-guarded in `index.css`)

## Components / files

- **New:** `src/components/WhimsyOverlay.tsx`, `src/components/WhimsyOverlay.css`
- **Edit:** `src/pages/Home.tsx` (click handler, state, render overlay + confetti),
  `src/pages/Home.css` (star spin keyframes + clickable cursor)
- **Untouched:** Navigation terminal `party mode` toggle — independently toggles
  the same `body.party-mode` class.

## Cleanup / safety

- Clear the timer on unmount and remove `body.party-mode` on unmount so leaving
  the page mid-party doesn't strand the class.
