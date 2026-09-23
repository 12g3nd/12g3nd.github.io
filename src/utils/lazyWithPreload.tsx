import { use } from 'react';
import type { ComponentType } from 'react';

type Module<P> = { default: ComponentType<P> };

export type LazyWithPreload<P extends object = object> = ComponentType<P> & {
  /** Start fetching the chunk. Safe to call any number of times, and to ignore. */
  preload: () => Promise<void>;
};

const RELOAD_KEY = 'sjsys_chunk_reload';

/**
 * A deploy replaces every hashed chunk in dist/, so a tab opened before it asks
 * for files that no longer exist the next time it loads one — and GitHub Pages
 * answers with its HTML 404, which fails as a module. The page the visitor asked
 * for is fine on the server; only this tab's copy of the app is stale, so load
 * it fresh. Once, though: a chunk still missing after a reload is a real error,
 * and looping on it would be worse than surfacing it.
 */
function recover(err: unknown): Promise<never> {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last > 10_000) {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
      window.location.reload();
      return new Promise<never>(() => {});
    }
  } catch { /* storage blocked: no way to tell a first failure from a loop */ }
  throw err;
}

/**
 * `React.lazy`, with a `preload()` that actually saves the suspend.
 *
 * `React.lazy` only learns its module has arrived from a `.then` callback it
 * attaches the first time it renders, so it suspends on that render even when
 * the chunk was fetched long before. Here the module is kept in a variable the
 * moment it lands, and a render that finds it there never suspends at all —
 * which is what lets main.tsx paint a transmission whole on the first frame.
 */
export function lazyWithPreload<P extends object = object>(
  load: () => Promise<Module<P>>,
): LazyWithPreload<P> {
  let Loaded: ComponentType<P> | null = null;
  let loading: Promise<void> | null = null;
  let rendering: Promise<void> | null = null;

  const preload = () => {
    loading ??= load().then(
      (mod) => { Loaded = mod.default; },
      // Forget a failed fetch so the next attempt makes a new one — a prefetch
      // that failed offline must not poison the render that comes later.
      (err) => { loading = null; throw err; },
    );
    return loading;
  };

  function Lazy(props: P) {
    // Only a render recovers from a failure; a background prefetch reloading
    // the page out from under someone reading it would be far worse.
    if (!Loaded) use((rendering ??= preload().catch(recover)));
    return Loaded ? <Loaded {...props} /> : null;
  }

  return Object.assign(Lazy, { preload });
}
