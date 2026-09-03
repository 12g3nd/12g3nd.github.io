import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { OWN_BUTTON, badges, neighbours } from '../data/buttons';
import { SITE } from '../data/routeMeta';
import './ButtonWall.css';

/** The snippet someone else pastes to link here. Absolute URLs — it runs on their site. */
const EMBED = `<a href="${SITE}"><img src="${SITE}${OWN_BUTTON.src}" width="88" height="31" alt="${OWN_BUTTON.alt}" /></a>`;

/** How long the confirmation stays up. */
const TOAST_MS = 2000;

type Toast = null | 'copied' | 'manual';

function BadgeImage({ name, alt, title }: { name: string; alt: string; title?: string }) {
  return (
    <img
      className="buttons__img"
      src={`/buttons/${name}.png`}
      width="88"
      height="31"
      alt={alt}
      title={title}
      loading="lazy"
      decoding="async"
    />
  );
}

/**
 * The 88x31 wall: one row, with this site's own button at its centre.
 *
 * Every image is given explicit width and height. That is not decoration: the
 * footer learned this the hard way with the webring logo, which was sized
 * `height: auto` and made the footer one height before it loaded and another
 * after, on every page. More images with no reserved box would be more of that.
 */
export default function ButtonWall() {
  const [toast, setToast] = useState<Toast>(null);
  const manualRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLUListElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // The row never wraps, so on a narrow screen it scrolls — and it would open
  // hard left, hiding the button the whole arrangement is centred on. Same fix
  // the concrete poem needed.
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, []);

  const copy = async () => {
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(EMBED);
      setToast('copied');
      timer.current = window.setTimeout(() => setToast(null), TOAST_MS);
    } catch {
      // No clipboard permission, or an insecure context. Show the snippet and
      // select it so the manual path is one keystroke rather than a dead end.
      // This one stays up until dismissed — there is something to act on.
      setToast('manual');
      window.requestAnimationFrame(() => manualRef.current?.select());
    }
  };

  // Own button at the midpoint of everything else, so it stays centred as the
  // list grows rather than being pinned to a hardcoded index.
  const others = [...badges, ...neighbours];
  const mid = Math.floor(others.length / 2);

  return (
    <section className="buttons" aria-label="Buttons">
      <ul className="buttons__row" ref={rowRef}>
        {others.slice(0, mid).map((b) => (
          <li key={b.name} className="buttons__cell">
            {b.href ? (
              b.href.startsWith('/') ? (
                <Link to={b.href}><BadgeImage {...b} /></Link>
              ) : (
                <a href={b.href} target="_blank" rel="noreferrer"><BadgeImage {...b} /></a>
              )
            ) : (
              <BadgeImage {...b} />
            )}
          </li>
        ))}

        <li className="buttons__cell">
          {/* No label beside it — the button IS the affordance, and the
              confirmation is what tells you it worked. `title` carries the
              hint for anyone who hovers first. */}
          <button
            type="button"
            className="buttons__copy"
            onClick={copy}
            title="Copy the HTML to link to this site"
            aria-label="Copy the HTML to link to this site"
          >
            <img
              className="buttons__img buttons__img--own"
              src={OWN_BUTTON.src}
              srcSet={`${OWN_BUTTON.src} 1x, ${OWN_BUTTON.src2x} 2x`}
              width="88"
              height="31"
              alt={OWN_BUTTON.alt}
            />
          </button>
        </li>

        {others.slice(mid).map((b) => (
          <li key={b.name} className="buttons__cell">
            {b.href ? (
              b.href.startsWith('/') ? (
                <Link to={b.href}><BadgeImage {...b} /></Link>
              ) : (
                <a href={b.href} target="_blank" rel="noreferrer"><BadgeImage {...b} /></a>
              )
            ) : (
              <BadgeImage {...b} />
            )}
          </li>
        ))}
      </ul>

      {/* role="status" so the confirmation is announced rather than only seen —
          a copy that gives no feedback to a screen reader is a copy that
          silently failed as far as that reader knows. */}
      <div className="buttons__toast-layer" role="status" aria-live="polite">
        {toast === 'copied' && (
          <p className="buttons__toast">
            <span className="buttons__toast-mark" aria-hidden="true">✓</span>
            copied — paste it anywhere you'd link me
          </p>
        )}
        {toast === 'manual' && (
          <div className="buttons__toast buttons__toast--manual">
            <span className="buttons__toast-label">copy this:</span>
            <input
              ref={manualRef}
              className="buttons__manual"
              readOnly
              value={EMBED}
              aria-label="HTML to link to this site"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              className="buttons__toast-close"
              onClick={() => setToast(null)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
