/* Theme switching for the (easter-egg) light/dark modes.
   The whole site reads from CSS variables keyed off a `.theme-light` class on
   <html>, so switching is just toggling that class + persisting the choice.
   main.tsx re-applies it before first paint to avoid a flash. Keep the literals
   here in sync with main.tsx. */

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'sjsys_theme';
const LIGHT_CLASS = 'theme-light';

export function getTheme(): Theme {
  return document.documentElement.classList.contains(LIGHT_CLASS) ? 'light' : 'dark';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle(LIGHT_CLASS, theme === 'light');
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    // Private-mode / storage-denied: the class still applies for this session.
    void e;
  }
}

/** Flip to the other theme and persist it. Returns the theme now in effect. */
export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'light' ? 'dark' : 'light';
  applyTheme(next);
  return next;
}
