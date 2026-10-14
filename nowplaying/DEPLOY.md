# Deploying the now-playing Worker

A standalone Cloudflare Worker that tells the turntable on `/media` what you are
listening to on Spotify. Like `worker/` it is **not** part of the GitHub Pages
build, and it shares nothing with the guestbook Worker; it owns no data, so it
can be redeployed whenever.

Until it is deployed the turntable simply sits still, which is also what it does
whenever nothing is playing.

## 1. A Spotify app (once)

1. Go to <https://developer.spotify.com/dashboard> and create an app.
2. Redirect URI: `http://127.0.0.1:8888/callback` (exactly). API: Web API.
3. Note its **Client ID** and **Client secret**.

## 2. The refresh token (once)

```powershell
cd nowplaying
npm install
$env:SPOTIFY_CLIENT_ID="your client id"
$env:SPOTIFY_CLIENT_SECRET="your client secret"
node get-refresh-token.mjs
```

Open the link it prints, approve, and the refresh token appears in the terminal.
It asks only for read access to what is playing and what last played.

## 3. Secrets and deploy

```powershell
npx wrangler login
npx wrangler secret put SPOTIFY_CLIENT_ID
npx wrangler secret put SPOTIFY_CLIENT_SECRET
npx wrangler secret put SPOTIFY_REFRESH_TOKEN
npx wrangler deploy
```

The route in `wrangler.toml` serves it at `https://nowplaying.jarabana.com/now`,
which `NOW_PLAYING_URL` in `src/components/NowPlaying.tsx` already points at.
Check it with a browser: you should see `{"playing":false,...}` or the track.

## Current setup (stood up 2026-10-14)

- Worker `sjs-nowplaying` on the Cloudflare account that owns `jarabana.com`,
  served at `https://nowplaying.jarabana.com/now`.
- Spotify app client ID `e0120d78769347fc939732e8fa350666` (public; it appears
  in the sign-in link anyway). The client secret and refresh token live only as
  Worker secrets and in your password manager, never in this repo.
- Check it any time: open the `/now` URL while a song plays. You should see the
  track; with nothing playing, `{"playing":false,"last":{...}}`.

## Always run wrangler from inside `nowplaying/`

Every `npx wrangler` command reads `wrangler.toml` from the current folder.
Run from the repo root, where there is none, wrangler 4 starts its automatic
project setup instead: it rewires the site's `vite.config.ts` and
`package.json` and publishes the whole site as a new Worker. That happened once
(as "portfolio"); it was reverted and deleted. Start every session with:

```powershell
cd C:\Users\SJ\Downloads\12g3nd.github.io\nowplaying
```

and check the prompt ends in `\nowplaying>`. A deploy should list
`nowplaying.jarabana.com (custom domain)`; if it mentions "portfolio" or
"assets", stop.

## When the turntable stays idle while you are playing

A failure looks the same as "nothing playing", on purpose, so read the log:

```powershell
npx wrangler tail sjs-nowplaying
```

Then load `/media` (or the `/now` URL) and look for the `nowplaying:` line.

| The log says | Meaning | Fix |
|---|---|---|
| `token 400 … invalid_client` | client ID or secret is wrong | `npx wrangler secret put SPOTIFY_CLIENT_ID` / `…_SECRET` again; watch for stray spaces, quotes or extra characters |
| `token 400 … invalid_grant` | refresh token is wrong, partial or revoked | run step 2 again and `npx wrangler secret put SPOTIFY_REFRESH_TOKEN`; paste **only** the long string, not the `SPOTIFY_REFRESH_TOKEN:` label |
| `player 403` | the app can't see your account | Spotify dashboard → your app → User Management → add the email you listen on |

Saving a secret takes effect straight away; no redeploy needed. Answers are
cached for 15s, so wait that long before checking again.

Other things that tripped the first setup:

- **`client_id: Invalid` in the browser**: the `$env:` line still had a
  placeholder, or a stray character after the closing quote.
- **`$env:` values vanish**: they last only for that terminal tab. Set them
  again in any new tab before running the token script.
- **`Cannot find module …get-refresh-token.mjs`**: you are not in `nowplaying/`.
- **`EADDRINUSE 127.0.0.1:8888`**: an earlier run of the token script is still
  waiting in another tab. Close that tab (or end that `node` process) and rerun.
- The npm "vulnerabilities" warning is in wrangler's own dev tooling; don't run
  `npm audit fix --force`, which can break wrangler.
- The token script prints the refresh token to the terminal. Clear that
  terminal (`Clear-Host`) or close the tab afterwards.

## Notes

- Answers are cached at the edge for 15 seconds, so Spotify is asked at most
  four times a minute however many people have the page open.
- CORS allows `jarabana.com`, `www.jarabana.com`, `12g3nd.github.io` and the
  local dev servers; edit `ALLOWED_ORIGINS` in `index.ts` to change it.
- To revoke: remove the app at <https://www.spotify.com/account/apps/>, or delete
  the `SPOTIFY_REFRESH_TOKEN` secret.
