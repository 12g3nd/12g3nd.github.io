/// <reference types="@cloudflare/workers-types" />

/**
 * SJ.SYS guestbook Worker.
 *
 *   GET  /entries?approved=1  → { entries: Entry[] }  (public; approved rows only)
 *   POST /sign                → 201 { ok, message }   (inserts a pending row)
 *
 * Approval is manual: rows land with approved = 0 and are flipped to 1 from the
 * D1 dashboard or via `wrangler d1 execute` (see DEPLOY.md). That queue — not a
 * captcha — is the real spam filter; pair it with a dashboard IP rate-limit rule
 * on POST /sign (see wrangler.toml).
 */

export interface Env {
  DB: D1Database;
}

const ALLOWED_ORIGINS = new Set<string>([
  'https://12g3nd.github.io',
  'https://jarabana.com',
  'https://www.jarabana.com',
  'http://localhost:5173',
]);

const MAX_NAME = 40;
const MAX_DESCRIPTION = 120;
// Hard cap on the serialized signature so a single POST can't balloon the DB.
const MAX_STROKE_JSON = 100_000;

function corsHeaders(origin: string | null): Record<string, string> {
  // Echo the request origin only when it's allow-listed; otherwise fall back to
  // the production origin so the response is never wildcard-open.
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://12g3nd.github.io';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(data: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

type StrokePoint = { x: number; y: number };

/** Validate + normalize the posted signature into a clean StrokePoint[][]. */
function parseStrokes(raw: unknown): StrokePoint[][] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const strokes: StrokePoint[][] = [];
  for (const stroke of raw) {
    if (!Array.isArray(stroke)) return null;
    const points: StrokePoint[] = [];
    for (const point of stroke) {
      if (
        typeof point !== 'object' ||
        point === null ||
        typeof (point as StrokePoint).x !== 'number' ||
        typeof (point as StrokePoint).y !== 'number'
      ) {
        return null;
      }
      const { x, y } = point as StrokePoint;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      points.push({ x, y });
    }
    if (points.length > 0) strokes.push(points);
  }
  return strokes.length > 0 ? strokes : null;
}

interface EntryRow {
  id: number;
  first_name: string;
  last_name: string;
  description: string;
  stroke_data: string;
  created_at: string;
}

async function handleEntries(env: Env, origin: string | null): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT id, first_name, last_name, description, stroke_data, created_at
       FROM entries
      WHERE approved = 1
      ORDER BY created_at DESC, id DESC`
  ).all<EntryRow>();

  const entries = (results ?? []).map((row) => ({
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    description: row.description,
    // Stored as JSON text; hand the client a real array so it matches the
    // frontend GuestbookEntry type (stroke_data: StrokePoint[][]).
    stroke_data: safeParseStrokes(row.stroke_data),
    created_at: row.created_at,
  }));

  return json({ entries }, 200, origin);
}

function safeParseStrokes(value: string): StrokePoint[][] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function handleSign(request: Request, env: Env, origin: string | null): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400, origin);
  }

  const { first_name, last_name, description, stroke_data } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof first_name !== 'string' ||
    typeof last_name !== 'string' ||
    typeof description !== 'string'
  ) {
    return json({ ok: false, error: 'Missing or invalid fields.' }, 400, origin);
  }

  const fn = first_name.trim();
  const ln = last_name.trim();
  const desc = description.trim();

  if (!fn || !ln || !desc) {
    return json({ ok: false, error: 'First name, last name and description are all required.' }, 400, origin);
  }
  if (fn.length > MAX_NAME || ln.length > MAX_NAME) {
    return json({ ok: false, error: `Names must be ${MAX_NAME} characters or fewer.` }, 400, origin);
  }
  if (desc.length > MAX_DESCRIPTION) {
    return json({ ok: false, error: `Description must be ${MAX_DESCRIPTION} characters or fewer.` }, 400, origin);
  }

  const strokes = parseStrokes(stroke_data);
  if (!strokes) {
    return json({ ok: false, error: 'A signature is required.' }, 400, origin);
  }

  const strokeJson = JSON.stringify(strokes);
  if (strokeJson.length > MAX_STROKE_JSON) {
    return json({ ok: false, error: 'Signature data is too large.' }, 400, origin);
  }

  await env.DB.prepare(
    `INSERT INTO entries (first_name, last_name, description, stroke_data, approved)
     VALUES (?, ?, ?, ?, 0)`
  )
    .bind(fn, ln, desc, strokeJson)
    .run();

  return json({ ok: true, message: 'Entry submitted for review.' }, 201, origin);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method === 'GET' && url.pathname === '/entries') {
      return handleEntries(env, origin);
    }

    if (request.method === 'POST' && url.pathname === '/sign') {
      return handleSign(request, env, origin);
    }

    return json({ ok: false, error: 'Not found.' }, 404, origin);
  },
};
