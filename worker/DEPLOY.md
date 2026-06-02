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

## Local development

```bash
npx wrangler dev   # serves the Worker at http://localhost:8787
```

Temporarily point `WORKER_URL` at `http://localhost:8787` while developing against
the local Vite server (`http://localhost:5173` is already CORS-allowlisted in
`index.ts`). Don't commit that local URL.
