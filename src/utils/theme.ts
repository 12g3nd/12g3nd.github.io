/* Theme switching: paper (the default) and dark.
   The whole site reads from CSS variables, and dark mode is a `.theme-dark`
   class on <html> over the paper defaults in src/index.css. Switching is just
   toggling that class + persisting the choice. The inline script in index.html
   re-applies it before first paint to avoid a flash of paper; keep the storage
   key and class name there in sync with these. */

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'sjsys_theme';
const DARK_CLASS = 'theme-dark';

export function getTheme(): Theme {
  return document.documentElement.classList.contains(DARK_CLASS) ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle(DARK_CLASS, theme === 'dark');
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    // Private-mode / storage-denied: the class still applies for this session.
    void e;
  }
}

/** Flip to the other theme and persist it. Returns the theme now in effect. */
export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
