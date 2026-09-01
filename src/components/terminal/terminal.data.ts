/**
 * Everything the terminal knows, as data.
 *
 * These tables were sixty lines at the top of Navigation.tsx, which meant
 * adding a command — the most common edit this component gets — started with
 * scrolling past them to find the interpreter, or scrolling past the
 * interpreter to find them. They are pure data with no behaviour, so they live
 * on their own and the component is shorter for it.
 *
 * Adding a command usually means two edits: a case in runCommand (see
 * useTerminal) and, if it is meant to be discoverable, an entry in COMPLETIONS.
 */

/** Cycled by the idle typewriter in the nav bar. */
export const PHRASES = [
  "> scanning user... name: srihith jarabana... status: building things",
  "> clout: [citation needed]. aura: self-reported.",
  "> running diagnostics... critical error: caffeine levels low.",
  "> current aesthetic: brutalism x y2k.",
  "> location ping: robarts library, 12th floor. status: on the grind.",
  "> fit check... evaluating... result: trying too hard. recalibrating.",
  "> easter egg check... found one: most images are clickable.",
  "> tip: double-click this bar, then type 'help'.",
];

/** Shown first only during the 1–5am visitor-local window (see isLateNight). */
export const LATE_NIGHT_PHRASE =
  "> caffeine [CRITICAL]... it's past 1am. why are we both awake?";

/**
 * Commands that navigate. Matched before the interpreter's switch, so a route
 * here always wins over a command of the same name.
 */
export const ROUTES: Record<string, string> = {
  projects: '/projects',
  business: '/business',
  'cd business': '/business',
  'business.xlsx': '/business',
  'open business.xlsx': '/business',
  media: '/media',
  poetry: '/poetry',
  guestbook: '/guestbook',
  'cat guestbook.log': '/guestbook',
  'open guestbook.log': '/guestbook',
  blog: '/blog',
  home: '/',
  '~': '/',
  'cd ~': '/',
  cd: '/',
};

/**
 * Clickable `ls` output: each entry runs its command on click (navigate, or
 * print like `cat`), so the directory listing behaves like a real shell.
 */
export const LS_ENTRIES: { label: string; cmd: string }[] = [
  { label: 'projects/', cmd: 'projects' },
  { label: 'media/', cmd: 'media' },
  { label: 'poetry/', cmd: 'poetry' },
  { label: 'blog/', cmd: 'blog' },
  { label: 'business.xlsx', cmd: 'business' },
  { label: 'beliefs.txt', cmd: 'cat beliefs.txt' },
  { label: 'rootbeer.log', cmd: 'cat rootbeer.log' },
  { label: 'resume.pdf', cmd: 'resume' },
  { label: 'guestbook.log', cmd: 'guestbook' },
  { label: '.secret', cmd: 'cat .secret' },
];

/**
 * Commands offered by tab-autocomplete. Deliberately omits the deepest easter
 * eggs (cat .secret, 42, whoami --real, …) so poking around still rewards.
 */
export const COMPLETIONS: string[] = [
  'projects', 'business', 'media', 'poetry', 'blog', 'guestbook', 'home',
  'help', 'whoami', 'uptime', 'resume', 'ls', 'clear', 'exit',
  'cat beliefs.txt', 'cat rootbeer.log', 'cat guestbook.log',
  'sudo hire-me', 'theme dark', 'theme light', 'matrix', 'party mode',
];
