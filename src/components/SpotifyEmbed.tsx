import { useState } from 'react';
import './SpotifyEmbed.css';

/* A click-to-load stand-in for Spotify's iframe.
 *
 * The embed is by a distance the heaviest thing on /media: one iframe is a
 * whole second document — Spotify's own scripts, fonts and artwork — and there
 * are two of them. `loading="lazy"` only delays that until the frame nears the
 * viewport, which on this page it does almost immediately.
 *
 * So nothing loads until asked. The button below reserves exactly the height
 * the iframe will occupy, so swapping one for the other shifts no layout, and
 * until then the page costs nothing and tells Spotify nothing about who is
 * reading it.
 *
 * Two clicks to hear a track — one here, one on Spotify's own play button — is
 * the deliberate cost. The embed cannot be made to autoplay reliably, and a
 * facade that promised it would be worse than one that does not.
 */

// Matches the `height` the iframe is given below. They are the same number on
// purpose: the placeholder is standing in for that exact box.
const EMBED_HEIGHT = 352;

type Props = {
  id: string;
  label: string;
};

export default function SpotifyEmbed({ id, label }: Props) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <iframe
        src={`https://open.spotify.com/embed/playlist/${id}?utm_source=generator`}
        title={`Spotify playlist: ${label}`}
        width="100%"
        height={EMBED_HEIGHT}
        style={{ border: 0 }}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      />
    );
  }

  return (
    // The visible text says only "load spotify player": the placard directly
    // below already names the playlist, and printing it here too read as a
    // stutter. The name still belongs in the accessible name, though — a screen
    // reader user meets the button before the caption that would disambiguate
    // it, so without this the page offers two buttons called the same thing.
    <button
      type="button"
      className="spotify-facade"
      style={{ height: EMBED_HEIGHT }}
      onClick={() => setLoaded(true)}
      aria-label={`Load the Spotify player for ${label}`}
    >
      <span className="spotify-facade__glyph" aria-hidden="true">
        ▶
      </span>
      <span className="spotify-facade__label" aria-hidden="true">
        load spotify player
      </span>
      <span className="spotify-facade__hint" aria-hidden="true">
        connects to spotify.com
      </span>
    </button>
  );
}
