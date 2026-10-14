import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import './QuoteCube.css';

/**
 * The reference quotes, one per face of a cube printed on the cream paper
 * stock the quote card used before it.
 *
 * It turns to the next face on its own, every few seconds, and holds while it
 * is hovered or has focus. The moment someone takes over (a button, a drag) it
 * stops turning for good: they are reading now. A drag spins it freely and,
 * on release, settles on whichever face ended up nearest the viewer.
 *
 * It is a die, so the face picker is six dice (pips, not numbers), and ROLL
 * throws it: a random face other than the current one, reached by tumbling a
 * couple of extra turns on both axes before it settles.
 *
 * Under reduced motion it never turns on its own and every move is instant,
 * a roll included.
 *
 * Adding a quote: fill the next entry in QUOTES. `image` is a path under
 * public/ (put new ones in public/quotes/); `href` links the attribution to
 * a source; `credit` is required whenever the image's licence asks for one,
 * and it is listed under the cube. A face with no entry shows as pending.
 *
 * Portraits are printed to match the Aristotle engraving: a 3:4 bust, toned
 * to sepia ink on cream (scripts/fixtures/quotes/ has the originals).
 */

/** `subject` names who is pictured, when that differs from the attribution. */
type Credit = { who: string; source: string; license?: string; licenseHref?: string; subject?: string };
type Quote = { text: string; by: string; href?: string; image?: string; credit?: Credit };

const CC_BY_4 = 'https://creativecommons.org/licenses/by/4.0/';
const CC_BY_SA_4 = 'https://creativecommons.org/licenses/by-sa/4.0/';
const CC_BY_2 = 'https://creativecommons.org/licenses/by/2.0/';

/* A leading aside, "(Probably not) Aristotle", goes on its own small line
   above the name, so the plate is a name and not a sentence wrapping three
   ways in a narrow column. */
function Byline({ by }: { by: string }) {
  const m = /^(\([^)]*\))\s*(.+)$/.exec(by);
  if (!m) return <>{by}</>;
  return (
    <>
      <span className="qcube__aside">{m[1]}</span>
      {m[2]}
    </>
  );
}

const QUOTES: Quote[] = [
  {
    text: 'It is the mark of an educated mind, to entertain a thought without accepting it.',
    by: '(Probably not) Aristotle',
    href: 'https://sententiaeantiquae.com/2018/09/22/nope-aristotle-did-not-say-it-is-the-mark-of-an-educated-mind-to-entertain-a-thought-without/',
    image: '/Aristotle.jpg',
    credit: {
      subject: 'Aristotle',
      who: 'P. Fidanza after Raphael, Wellcome Library, London',
      source: 'https://commons.wikimedia.org/wiki/File:Aristotle._Line_engraving_by_P._Fidanza_after_Raphael_Sanzio_Wellcome_V0000205.jpg',
      license: 'CC BY 4.0',
      licenseHref: CC_BY_4,
    },
  },
  {
    text: 'You only live once, but if you do it right, once is enough.',
    by: 'Mae West',
    image: '/quotes/mae-west.webp',
    credit: {
      who: 'Los Angeles Daily News, UCLA Library',
      source: 'https://commons.wikimedia.org/wiki/File:Mae_West_in_court_1940-02-20_(2).jpg',
      license: 'CC BY 4.0',
      licenseHref: CC_BY_4,
    },
  },
  {
    text: "If you're going through hell, keep going.",
    by: 'Winston Churchill',
    image: '/quotes/churchill.webp',
    credit: {
      who: 'Donald Sheridan (painting)',
      source: 'https://commons.wikimedia.org/wiki/File:Winston_Churchill.jpg',
      license: 'CC BY-SA 4.0',
      licenseHref: CC_BY_SA_4,
    },
  },
  {
    text: 'The worst time to have a heart attack is during a game of charades.',
    by: 'Demetri Martin',
    image: '/quotes/demetri-martin.webp',
    credit: {
      who: 'Tammy Lo',
      source: 'https://commons.wikimedia.org/wiki/File:Demetri_Martin_@_Beacon_Theatre.jpg',
      license: 'CC BY 2.0',
      licenseHref: CC_BY_2,
    },
  },
  {
    text: "In three words I can sum up everything I've learned about life: it goes on.",
    by: 'Robert Frost',
    image: '/quotes/robert-frost.webp',
    credit: {
      who: 'Gardner Cox (painting), Carl Albert Research and Studies Center',
      source: 'https://commons.wikimedia.org/wiki/File:Portrait_of_Robert_Frost.jpg',
      license: 'CC BY-SA 4.0',
      licenseHref: CC_BY_SA_4,
    },
  },
  {
    text: 'Keep your eyes to the sky, never glued to your shoe',
    by: 'Mac Miller',
    image: '/quotes/mac-miller.webp',
    credit: {
      who: 'Nicolas Völcker, Wikimedia Commons',
      source: 'https://commons.wikimedia.org/wiki/File:Mac_Miller_(19)_%E2%80%93_splash!_Festival_20_(2017)_(cropped).jpg',
      license: 'CC BY-SA 4.0',
      licenseHref: CC_BY_SA_4,
    },
  },
];

const FACES = 6;
const DWELL_MS = 4500;

// Each face's own transform, and the cube rotation that shows it, slightly
// turned so a sliver of the next face reads as depth. Top and bottom are
// shown with no Y turn so their text comes up the right way round.
const FACE_TRANSFORM = ['rotateY(0deg)', 'rotateY(90deg)', 'rotateY(180deg)', 'rotateY(-90deg)', 'rotateX(90deg)', 'rotateX(-90deg)'];
const VIEW: [number, number][] = [[-12, -20], [-12, -110], [-12, -200], [-12, -290], [-100, 0], [78, 0]];

// Which cells of a 3 x 3 grid hold a pip, for each face of a die.
const PIPS = [[4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];
const ROLL_MS = 1700;

function Pips({ n }: { n: number }) {
  return (
    <span className="qcube__pips" aria-hidden="true">
      {Array.from({ length: 9 }, (_, cell) => (
        <i key={cell} className={PIPS[n].includes(cell) ? 'is-on' : undefined} />
      ))}
    </span>
  );
}

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The face pointing most nearly at the viewer for a given cube rotation. */
function facingFace(rx: number, ry: number): number {
  let best = 0;
  let bestZ = -Infinity;
  FACE_TRANSFORM.forEach((t, i) => {
    const z = new DOMMatrix(`rotateX(${rx}deg) rotateY(${ry}deg) ${t}`).transformPoint({ x: 0, y: 0, z: 1 }).z;
    if (z > bestZ) { bestZ = z; best = i; }
  });
  return best;
}

/** `target` plus whole turns, chosen to land nearest `from`, so it never spins the long way. */
const nearest = (target: number, from: number) => target + Math.round((from - target) / 360) * 360;

export default function QuoteCube() {
  const [face, setFace] = useState(0);
  const [rot, setRot] = useState<[number, number]>(VIEW[0]);
  const [dragging, setDragging] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [announce, setAnnounce] = useState('');
  const wrap = useRef<HTMLDivElement | null>(null);
  const held = useRef(false); // hovered or focused
  const taken = useRef(false); // someone has driven it; stop turning by itself
  const drag = useRef({ x: 0, y: 0, rx: 0, ry: 0, moved: false });

  const faceRef = useRef(0);
  const show = useCallback((i: number) => {
    faceRef.current = i;
    setFace(i);
    setRot(([rx, ry]) => [nearest(VIEW[i][0], rx), nearest(VIEW[i][1], ry)]);
  }, []);

  const roll = () => {
    if (rolling) return;
    taken.current = true;
    let next = Math.floor(Math.random() * (FACES - 1));
    if (next >= faceRef.current) next++;
    const q = QUOTES[next];
    setAnnounce(`Rolled a ${next + 1}${q ? `: ${q.by}` : ''}.`);
    if (reducedMotion()) { show(next); return; }
    faceRef.current = next;
    setFace(next);
    setRolling(true);
    // Land on the face, but by way of two to three extra turns each way.
    const spinX = (2 + Math.floor(Math.random() * 2)) * 360 * (Math.random() < 0.5 ? -1 : 1);
    const spinY = (2 + Math.floor(Math.random() * 2)) * 360 * (Math.random() < 0.5 ? -1 : 1);
    setRot(([rx, ry]) => [nearest(VIEW[next][0], rx) + spinX, nearest(VIEW[next][1], ry) + spinY]);
    window.setTimeout(() => setRolling(false), ROLL_MS);
  };

  useEffect(() => {
    if (reducedMotion()) return;
    let onscreen = false;
    const io = new IntersectionObserver(([e]) => { onscreen = e?.isIntersecting ?? false; });
    if (wrap.current) io.observe(wrap.current);
    const t = window.setInterval(() => {
      if (taken.current || held.current || !onscreen || document.hidden) return;
      show((faceRef.current + 1) % FACES);
    }, DWELL_MS);
    return () => { window.clearInterval(t); io.disconnect(); };
  }, [show]);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, rx: rot[0], ry: rot[1], moved: false };
    setDragging(true);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const d = drag.current;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    setRot([Math.max(-120, Math.min(120, d.rx - dy * 0.5)), d.ry + dx * 0.5]);
  };
  const onUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (!drag.current.moved) return;
    taken.current = true;
    show(facingFace(rot[0], rot[1]));
  };

  return (
    <div
      ref={wrap}
      className="qcube"
      onPointerEnter={() => { held.current = true; }}
      onPointerLeave={() => { held.current = false; }}
      onFocus={() => { held.current = true; }}
      onBlur={() => { held.current = false; }}
    >
      <div className="qcube__stage">
        <div
          className={`qcube__cube${dragging ? ' is-dragging' : ''}${rolling ? ' is-rolling' : ''}${reducedMotion() ? ' is-still' : ''}`}
          style={{ transform: `translateZ(calc(var(--s) / -2)) rotateX(${rot[0]}deg) rotateY(${rot[1]}deg)` }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          {FACE_TRANSFORM.map((t, i) => {
            const q = QUOTES[i];
            return (
              <figure
                key={t}
                className={`qcube__face${q ? '' : ' is-pending'}${q && q.text.length > 120 ? ' is-long' : ''}`}
                style={{ transform: `${t} translateZ(calc(var(--s) / 2))` }}
                // Only the face toward the viewer is reachable; the rest keep
                // their links out of the tab order and the reading order.
                inert={i !== face}
              >
                {q ? (
                  <>
                    <blockquote>“{q.text}”</blockquote>
                    {q.image && <img src={q.image} alt="" className="qcube__img" loading="lazy" decoding="async" draggable={false} />}
                    <figcaption>
                      {q.href ? <a href={q.href} target="_blank" rel="noopener noreferrer"><Byline by={q.by} /> ↗</a> : <Byline by={q.by} />}
                    </figcaption>
                  </>
                ) : (
                  <span className="qcube__pending">[ quote {String(i + 1).padStart(2, '0')} pending ]</span>
                )}
              </figure>
            );
          })}
        </div>
      </div>
      <div className="qcube__controls">
        <div className="qcube__dice" role="group" aria-label="Choose a quote">
          {FACE_TRANSFORM.map((t, i) => (
            <button
              key={t}
              type="button"
              className="qcube__die"
              aria-pressed={i === face}
              aria-label={`Quote ${i + 1} of ${FACES}`}
              disabled={rolling}
              onClick={() => { taken.current = true; show(i); }}
            >
              <Pips n={i} />
            </button>
          ))}
        </div>
        <button type="button" className={`qcube__roll${rolling ? ' is-rolling' : ''}`} onClick={roll} disabled={rolling}>
          <span className="qcube__roll-die" aria-hidden="true"><Pips n={rolling ? (face + 2) % FACES : 4} /></span>
          Roll
        </button>
        <p className="sr-only" aria-live="polite">{announce}</p>
      </div>
      <details className="qcube__credits">
        <summary>portrait credits</summary>
        <ul>
          {QUOTES.filter((q) => q.credit).map(({ by, credit }) => (
            <li key={by}>
              {credit!.subject ?? by}: <a href={credit!.source} target="_blank" rel="noopener noreferrer">{credit!.who}</a>
              {credit!.license && (
                <>, <a href={credit!.licenseHref} target="_blank" rel="noopener noreferrer">{credit!.license}</a></>
              )}
            </li>
          ))}
        </ul>
        <p>All cropped, and all but Aristotle toned to sepia; the CC BY-SA ones are shared under the same licence.</p>
      </details>
    </div>
  );
}
