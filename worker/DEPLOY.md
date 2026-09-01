# Deploying the SJ.SYS guestbook Worker

This directory is a **standalone Cloudflare Worker** — it is *not* part of the
GitHub Pages build. Deploy it separately with [Wrangler](https://developers.cloudflare.com/workers/wrangler/).

```bash
cd worker
npm install        # pulls wrangler + @cloudflare/workers-types
npx wrangler login # one-time browser auth
```

## The three commands that stand it up

```bash
# 1. Create the D1 database. Copy the printed `database_id` into wrangler.toml.
npx wrangler d1 create sjsys-guestbook

# 2. Apply the schema to the remote database (creates the `entries` table).
npx wrangler d1 execute sjsys-guestbook --remote --file=./schema.sql

# 3. Deploy the Worker. The custom-domain route in wrangler.toml makes Cloudflare
#    auto-create the DNS record + TLS cert for https://guestbook.jarabana.com
#    (cert issuance can take a minute or two on first deploy).
npx wrangler deploy
```

`WORKER_URL` in [`src/hooks/useGuestbook.ts`](../src/hooks/useGuestbook.ts) is
already set to `https://guestbook.jarabana.com` to match the route in
`wrangler.toml`, so there's nothing to copy back after deploy — just push the site.

> Using the default `*.workers.dev` URL instead? Remove the `routes` block from
> `wrangler.toml`, deploy, then paste the printed `workers.dev` URL into
> `WORKER_URL`. CORS is allow-listed for `jarabana.com`, `www.jarabana.com` and
> `12g3nd.github.io` either way — edit `ALLOWED_ORIGINS` in `index.ts` to change it.

## Approving entries

New submissions land with `approved = 0` and stay hidden until you flip the flag:

```bash
# See what's waiting in the queue
npx wrangler d1 execute sjsys-guestbook --remote \
  --command "SELECT id, first_name, last_name, description, created_at FROM entries WHERE approved = 0 ORDER BY created_at DESC"

# Approve one
npx wrangler d1 execute sjsys-guestbook --remote \
  --command "UPDATE entries SET approved = 1 WHERE id = 5"

# Reject / delete one
npx wrangler d1 execute sjsys-guestbook --remote \
  --command "DELETE FROM entries WHERE id = 5"
```

You can also browse and edit rows directly in the Cloudflare dashboard
(**Workers & Pages → D1 → sjsys-guestbook**).

## Spam protection

There is no captcha — the manual approval queue is the real filter. As a first
line of defence, add a rate-limiting rule in the Cloudflare dashboard
(**Security → WAF → Rate limiting rules**) that caps `POST /sign` at **3
requests/hour per IP**.

## Session counter

The footer readout (`INBOUND_SESSIONS`) is one integer in the same D1 database.
It ships **after** the site does, so until these two commands run the footer
shows `------` rather than a number — that is the intended failure mode, not a
bug.

```bash
# 1. Create the counters table and seed it. Safe to re-run: the table creation
#    is guarded and the seed is INSERT OR IGNORE, so this will not reset a live
#    count.
npx wrangler d1 execute sjsys-guestbook --remote --file=./counters.sql

# 2. Ship the new /visit and /visits routes.
npx wrangler deploy
```

Verify:

```bash
curl https://guestbook.jarabana.com/visits          # -> {"ok":true,"count":N}
curl -X POST https://guestbook.jarabana.com/visit   # -> {"ok":true,"count":N+1}
```

The counter starts at zero and is only ever written to by the live site.
`VisitorCounter` gates the `POST` on `window.location.hostname`, so a dev
server, a `vite preview`, or anything else that is not jarabana.com /
12g3nd.github.io reads the number and never adds to it. That gate exists
because localhost is CORS-allowlisted here for the guestbook, which meant local
development was silently inflating the live count — and then "fixing" it meant
zeroing real visits along with the noise.

**Do not reset the counter as routine maintenance.** A number that gets wiped
whenever someone works on the site measures nothing. The command below is for
one situation only: deliberate abuse of the open endpoint.

```bash
npx wrangler d1 execute sjsys-guestbook --remote --command "UPDATE counters SET value = 0 WHERE name = 'sessions';"
```

To exercise the write path without touching production, run the Worker locally
against its own D1 — `wrangler dev --local` plus
`wrangler d1 execute sjsys-guestbook --local --file=./counters.sql` — and point
a browser at that instead.

`POST /visit` is unauthenticated and trivially inflatable by anyone willing to
run it in a loop. That is an accepted property, not an oversight: the honest
alternative to a fake-precise analytics widget is a number that is obviously a
mood ring. If it ever gets abused, the same WAF rate-limiting rule used for
`POST /sign` applies here.

## Local development

```bash
npx wrangler dev   # serves the Worker at http://localhost:8787
```

Temporarily point `WORKER_URL` at `http://localhost:8787` while developing against
the local Vite server (`http://localhost:5173` is already CORS-allowlisted in
`index.ts`). Don't commit that local URL.
