// One-time: get the Spotify refresh token the Worker runs on.
//
//   SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... node get-refresh-token.mjs
//   (PowerShell: $env:SPOTIFY_CLIENT_ID="..."; $env:SPOTIFY_CLIENT_SECRET="..."; node get-refresh-token.mjs)
//
// It prints a Spotify sign-in link. Open it, approve, and Spotify sends you
// back to this script on 127.0.0.1:8888, which trades the code for a refresh
// token and prints it once. Nothing is written to disk. Paste the token into
// `npx wrangler secret put SPOTIFY_REFRESH_TOKEN` and close the terminal.
//
// The app's Redirect URI in the Spotify dashboard must be exactly
// http://127.0.0.1:8888/callback (Spotify no longer accepts "localhost").

import { createServer } from 'node:http';

const id = process.env.SPOTIFY_CLIENT_ID;
const secret = process.env.SPOTIFY_CLIENT_SECRET;
if (!id || !secret) {
  console.error('Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET first (see the top of this file).');
  process.exit(1);
}

const REDIRECT = 'http://127.0.0.1:8888/callback';
// Read-only: what is playing, and what last played. Nothing that can change
// playback or see playlists.
const SCOPES = 'user-read-currently-playing user-read-recently-played';
const state = Math.random().toString(36).slice(2);

const auth = new URL('https://accounts.spotify.com/authorize');
auth.search = new URLSearchParams({ client_id: id, response_type: 'code', redirect_uri: REDIRECT, scope: SCOPES, state }).toString();

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', REDIRECT);
  if (url.pathname !== '/callback') return res.writeHead(404).end();
  if (url.searchParams.get('state') !== state || !url.searchParams.get('code')) {
    res.writeHead(400).end('State mismatch or no code. Run the script again.');
    return;
  }
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code: url.searchParams.get('code'), redirect_uri: REDIRECT }),
  });
  const data = await r.json();
  if (!r.ok || !data.refresh_token) {
    res.writeHead(500).end('Spotify refused the exchange. Check the client secret and redirect URI.');
    console.error(data);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' }).end('Done. The refresh token is in your terminal; you can close this tab.');
    console.log('\nSPOTIFY_REFRESH_TOKEN:\n' + data.refresh_token + '\n');
  }
  server.close();
});

server.listen(8888, '127.0.0.1', () => {
  console.log('Open this link, sign in and approve:\n\n' + auth.toString() + '\n');
});
