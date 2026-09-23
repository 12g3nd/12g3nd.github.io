import type { FC } from 'react';
import type { MDXProps } from 'mdx/types';
import { lazyWithPreload } from '../utils/lazyWithPreload';
import type { LazyWithPreload } from '../utils/lazyWithPreload';

// Every post body in src/content is picked up automatically — no per-post route
// or import. Add an .mdx file + a record in posts.ts and the post exists.
//
// Not eager: each body is its own chunk, fetched only when its post is opened or
// a link to it is pointed at. Bundled eagerly they were the largest thing in the
// app after React itself, and every visitor to every page downloaded all of
// them. Pages stay in the main bundle on purpose — see the note in App.tsx.
const loaders = import.meta.glob<{ default: FC<MDXProps> }>('../content/*.mdx');

export const postBodies: Record<string, LazyWithPreload<MDXProps>> = {};
for (const [path, load] of Object.entries(loaders)) {
  const slug = path.split('/').pop()!.replace(/\.mdx$/, '');
  postBodies[slug] = lazyWithPreload(load);
}

/**
 * Fetch the body a path will render, if it is a transmission. Resolves at once
 * for anything else, and for a slug with no body — the post page handles that.
 */
export function preloadPostBody(pathname: string): Promise<void> {
  const slug = /^\/blog\/([^/]+)\/?$/.exec(pathname)?.[1];
  return (slug && postBodies[slug]?.preload()) || Promise.resolve();
}
