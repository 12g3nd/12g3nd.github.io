import { useEffect, useState } from 'react';
import './NowPlaying.css';

/* The now-playing Worker (nowplaying/, see DEPLOY.md there). Until it is
   deployed this fails quietly and the turntable sits still. */
const NOW_PLAYING_URL = 'https://nowplaying.jarabana.com/now';

const POLL_MS = 30_000;
/* After a failure, wait longer before asking again, so an undeployed or
   broken Worker costs one request every five minutes, not two a minute. */
const BACKOFF_MS = 5 * 60_000;

type Now =
  | { playing: true; track: string; artists: string; album: string; art: string | null; url: string | null }
  | { playing: false; last?: { track: string; artists: string; url: string | null } };

/**
 * A record player that is only awake when I am actually listening. Playing:
 * the record turns at 33⅓, the tonearm sits in the groove, the cover is the
 * label. Nothing playing: the arm rests, the platter is still, and it says
 * what was on last, if Spotify said.
 *
 * Polls while the tab is visible and stops when it is hidden.
 */
export default function NowPlaying() {
  const [now, setNow] = useState<Now>({ playing: false });

  useEffect(() => {
    let timer = 0;
    let alive = true;

    const tick = async () => {
      if (document.hidden) return;
      let wait = POLL_MS;
      try {
        const res = await fetch(NOW_PLAYING_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as Now;
        if (alive) setNow(data);
      } catch {
        wait = BACKOFF_MS;
        if (alive) setNow({ playing: false });
      }
      if (alive) timer = window.setTimeout(tick, wait);
    };

    const onVisible = () => {
      window.clearTimeout(timer);
      if (!document.hidden) tick();
    };

    tick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const playing = now.playing;

  return (
    <figure className={`deck${playing ? ' is-playing' : ''}`}>
      <div className="deck__plinth" aria-hidden="true">
        <span className="deck__led" />
        <div className="deck__platter">
          <div className="deck__record">
            <span className="deck__label">
              {playing && now.art ? <img src={now.art} alt="" /> : <span className="deck__label-blank" />}
            </span>
            <span className="deck__spindle" />
          </div>
        </div>
        <div className="deck__arm">
          <span className="deck__arm-pivot" />
          <span className="deck__arm-rod" />
          <span className="deck__arm-head" />
        </div>
        <span className="deck__speed">33⅓</span>
      </div>

      <figcaption className="deck__caption">
        <p className="deck__status">{playing ? 'Now spinning' : 'Turntable idle'}</p>
        {playing ? (
          <>
            <p className="deck__track">
              {now.url ? (
                <a href={now.url} target="_blank" rel="noreferrer">{now.track}</a>
              ) : (
                now.track
              )}
            </p>
            <p className="deck__by">{now.artists}</p>
            {now.album && now.album !== now.track && <p className="deck__album">{now.album}</p>}
          </>
        ) : (
          <>
            <p className="deck__track deck__track--idle">Nothing on the platter right now.</p>
            {now.last && (
              <p className="deck__by">
                Last spun:{' '}
                {now.last.url ? (
                  <a href={now.last.url} target="_blank" rel="noreferrer">{now.last.track}</a>
                ) : (
                  now.last.track
                )}{' '}
                · {now.last.artists}
              </p>
            )}
          </>
        )}
        <p className="deck__note">live from Spotify</p>
      </figcaption>
    </figure>
  );
}
