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

## Notes

- Answers are cached at the edge for 15 seconds, so Spotify is asked at most
  four times a minute however many people have the page open.
- CORS allows `jarabana.com`, `www.jarabana.com`, `12g3nd.github.io` and the
  local dev servers; edit `ALLOWED_ORIGINS` in `index.ts` to change it.
- To revoke: remove the app at <https://www.spotify.com/account/apps/>, or delete
  the `SPOTIFY_REFRESH_TOKEN` secret.
