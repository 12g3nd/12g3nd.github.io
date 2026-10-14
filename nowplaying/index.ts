/// <reference types="@cloudflare/workers-types" />

/**
 * Now-playing Worker: what is on the turntable on /media.
 *
 *   GET /now  ->  { playing: true,  track, artists, album, art, url }
 *             |   { playing: false, last?: { track, artists, url } }
 *
 * The site is static, and Spotify's "currently playing" endpoint needs the
 * owner's own token, which must never reach a browser. So this Worker holds a
 * long-lived refresh token as a secret, trades it for a short access token, asks
 * Spotify what is playing, and hands back only the public facts above.
 *
 * Separate from worker/ (the guestbook) on purpose: that one owns real data and
 * is frozen; this one owns nothing and can be redeployed freely.
 *
 * Secrets (set with `wrangler secret put`, see DEPLOY.md):
 *   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
 */

export interface Env {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  SPOTIFY_REFRESH_TOKEN: string;
}

const ALLOWED_ORIGINS = new Set<string>([
  'https://12g3nd.github.io',
  'https://jarabana.com',
  'https://www.jarabana.com',
  'http://localhost:5173',
  'http://localhost:5180',
  'http://127.0.0.1:5180',
]);

/* Spotify is asked at most this often, however many people have /media open:
   the answer is cached at the edge in between. The page polls every 30s. */
const CACHE_SECONDS = 15;

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://jarabana.com';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

/* An access token lasts an hour. Kept in the isolate between requests so most
   requests skip the refresh; a cold isolate just asks again. */
let token: { value: string; expires: number } | null = null;

async function accessToken(env: Env): Promise<string> {
  if (token && token.expires > Date.now() + 60_000) return token.value;
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: env.SPOTIFY_REFRESH_TOKEN }),
  });
  if (!res.ok) throw new Error(`token ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 };
  return token.value;
}

type SpotifyImage = { url: string; width: number | null };
type SpotifyTrack = {
  name: string;
  external_urls?: { spotify?: string };
  artists?: { name: string }[];
  album?: { name: string; images?: SpotifyImage[] };
  /* Podcast episodes carry their show instead of artists and an album. */
  show?: { name: string; images?: SpotifyImage[] };
  images?: SpotifyImage[];
};

/* The smallest cover that is still at least 300px: the label on the record is
   about 120px across at 2x. */
function cover(images: SpotifyImage[] | undefined): string | null {
  if (!images?.length) return null;
  const fit = [...images].filter((i) => (i.width ?? 0) >= 300).sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
  return (fit[0] ?? images[0]).url;
}

function describe(item: SpotifyTrack) {
  return {
    track: item.name,
    artists: item.artists?.map((a) => a.name).join(', ') ?? item.show?.name ?? '',
    album: item.album?.name ?? item.show?.name ?? '',
    art: cover(item.album?.images ?? item.images ?? item.show?.images),
    url: item.external_urls?.spotify ?? null,
  };
}

async function nowPlaying(env: Env) {
  const auth = { Authorization: `Bearer ${await accessToken(env)}` };
  const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing?additional_types=episode', { headers: auth });

  // 204: nothing is playing anywhere.
  if (res.ok && res.status !== 204) {
    const data = (await res.json()) as { is_playing?: boolean; item?: SpotifyTrack | null };
    if (data.is_playing && data.item) return { playing: true, ...describe(data.item) };
  } else if (!res.ok) {
    throw new Error(`player ${res.status}`);
  }

  // Dormant: say what was last on, if Spotify will tell us.
  const recent = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', { headers: auth });
  if (recent.ok) {
    const data = (await recent.json()) as { items?: { track: SpotifyTrack }[] };
    const last = data.items?.[0]?.track;
    if (last) {
      const { track, artists, url } = describe(last);
      return { playing: false, last: { track, artists, url } };
    }
  }
  return { playing: false };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get('Origin');
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method !== 'GET' || url.pathname !== '/now') {
      return new Response('Not found', { status: 404, headers: corsHeaders(origin) });
    }

    // One cached answer for everyone; CORS headers are added per request.
    const cache = caches.default;
    const key = new Request(`${url.origin}/now`);
    let body: string;
    const hit = await cache.match(key);
    if (hit) {
      body = await hit.text();
    } else {
      try {
        body = JSON.stringify(await nowPlaying(env));
      } catch {
        // Spotify down or a bad token: the turntable just sits still.
        body = JSON.stringify({ playing: false });
      }
      ctx.waitUntil(
        cache.put(key, new Response(body, { headers: { 'Cache-Control': `public, max-age=${CACHE_SECONDS}` } })),
      );
    }

    return new Response(body, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
        ...corsHeaders(origin),
      },
    });
  },
};
