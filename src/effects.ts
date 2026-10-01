/* Ambient effects, parked rather than deleted.

   The site used to run a screen's worth of texture all the time — scanlines
   over every page, an ASCII field under the hero, page titles that decrypted
   themselves on every visit. Together they read as a costume, and since the
   move to paper they are the wrong material besides. Each one is switched off
   here instead of removed, the same bargain as BOOT_ENABLED in App.tsx: flip a
   flag and it comes back exactly as it was.

   What is *not* here is anything a visitor asks for — the Konami CRT burst,
   `matrix`, `party mode`. Those are invoked, not ambient, and they stay on. */

export const AMBIENT = {
  /** CRT scanlines over the whole viewport (`html.fx-scanlines` in index.css). */
  scanlines: false,
  /** The ASCII ripple field behind the home hero. */
  asciiRipple: false,
  /** ScrambleText's decrypt-on-mount. Off, it renders the text as written. */
  scramble: false,
} as const;
