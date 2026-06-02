import { useEffect, useState } from 'react';
import type { GuestbookEntry, StrokePoint } from '../types/guestbook';

/**
 * Public URL of the deployed Cloudflare Worker (see worker/DEPLOY.md).
 * Bound to the custom-domain route in worker/wrangler.toml (guestbook.jarabana.com).
 */
export const WORKER_URL = 'https://guestbook.jarabana.com';

// Module-level cache so navigating Home → /guestbook within a session reuses the
// fetched entries instead of hitting the Worker again. `entries === null` means
// "not loaded yet"; `promise` de-dupes concurrent first loads (Home + page).
const cache: { entries: GuestbookEntry[] | null; promise: Promise<GuestbookEntry[]> | null } = {
  entries: null,
  promise: null,
};

/** Coerce whatever the API returns for a stroke field into a clean StrokePoint[][]. */
function normalizeStrokes(raw: unknown): StrokePoint[][] {
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  const strokes: StrokePoint[][] = [];
  for (const stroke of value) {
    if (!Array.isArray(stroke)) continue;
    const points: StrokePoint[] = [];
    for (const point of stroke) {
      if (point && typeof point.x === 'number' && typeof point.y === 'number') {
        points.push({ x: point.x, y: point.y });
      }
    }
    if (points.length > 0) strokes.push(points);
  }
  return strokes;
}

async function fetchEntries(): Promise<GuestbookEntry[]> {
  const res = await fetch(`${WORKER_URL}/entries?approved=1`);
  if (!res.ok) throw new Error(`Failed to load guestbook (${res.status})`);
  const data = (await res.json()) as { entries?: unknown };
  const list = Array.isArray(data.entries) ? data.entries : [];
  return list.map((raw): GuestbookEntry => {
    const e = raw as Partial<GuestbookEntry>;
    return {
      id: Number(e.id),
      first_name: String(e.first_name ?? ''),
      last_name: String(e.last_name ?? ''),
      description: String(e.description ?? ''),
      stroke_data: normalizeStrokes(e.stroke_data),
      created_at: String(e.created_at ?? ''),
    };
  });
}

/**
 * Loads the approved guestbook entries once per session (module-cached).
 * Returns the same array on every consumer so Home and /guestbook stay in sync.
 */
export default function useGuestbook(): {
  entries: GuestbookEntry[];
  loading: boolean;
  error: string | null;
} {
  const [entries, setEntries] = useState<GuestbookEntry[]>(cache.entries ?? []);
  const [loading, setLoading] = useState(cache.entries === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    // Route both paths through a promise so every setState lands in an async
    // callback (never synchronously in the effect body). Initial state already
    // mirrors the cache, so the cached path resolves to a no-op; this also covers
    // the rare race where the cache fills between render and effect.
    const source =
      cache.entries !== null
        ? Promise.resolve(cache.entries)
        : (cache.promise ?? (cache.promise = fetchEntries()));

    source
      .then((list) => {
        if (cache.entries === null) cache.entries = list;
        cache.promise = null;
        if (active) {
          setEntries(list);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        cache.promise = null;
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load guestbook.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return { entries, loading, error };
}
