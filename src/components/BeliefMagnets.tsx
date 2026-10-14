import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import './BeliefMagnets.css';

/**
 * The three beliefs as fridge-poetry magnets. Each word is its own tile, set a
 * little crooked the way magnets end up; the predicates are coloured tiles.
 * Any of them can be dragged around to say something else, which is the
 * point: they are the three things I'd over-defend at a party, and here the
 * reader gets to argue back.
 *
 * Moves are kept on the element (a transform), not in state, so dragging does
 * not re-render the list, and they last until the page is left or "reset
 * here" slides every tile home.
 */

type Word = { text: string; tile?: string; ink?: string };

const LINES: Word[][] = [
  [{ text: 'Art' }, { text: 'is' }, { text: 'political.', tile: 'var(--line-media)', ink: 'var(--on-line-dark)' }],
  [{ text: 'Business' }, { text: 'is' }, { text: 'personal.', tile: 'var(--line-blog)', ink: 'var(--on-line-dark)' }],
  [{ text: 'Technology' }, { text: 'is' }, { text: 'philosophy.', tile: 'var(--line-poetry)', ink: 'var(--on-line-light)' }],
];

// Fixed tilts, so every visit sees the same fridge.
const TILT = [-2.2, 1.4, -0.8, 2.6, -1.6, 0.9, 1.8, -2.8, 0.6];

function Magnet({ word, tilt, resets }: { word: Word; tilt: number; resets: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const drag = useRef({ on: false, x: 0, y: 0, dx: 0, dy: 0 });

  // Each press of "reset here" bumps `resets`; the tile glides back home.
  useEffect(() => {
    if (!resets) return;
    const el = ref.current;
    drag.current.dx = 0;
    drag.current.dy = 0;
    if (!el) return;
    el.classList.add('is-returning');
    el.style.setProperty('translate', '0px 0px');
    const t = window.setTimeout(() => el.classList.remove('is-returning'), 450);
    return () => window.clearTimeout(t);
  }, [resets]);

  const place = () => {
    const d = drag.current;
    ref.current?.style.setProperty('translate', `${d.dx}px ${d.dy}px`);
  };

  const onDown = (e: PointerEvent<HTMLSpanElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { ...drag.current, on: true, x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy };
    ref.current?.classList.add('is-held');
  };
  const onMove = (e: PointerEvent<HTMLSpanElement>) => {
    const d = drag.current;
    if (!d.on) return;
    d.dx = e.clientX - d.x;
    d.dy = e.clientY - d.y;
    place();
  };
  const onUp = () => {
    drag.current.on = false;
    ref.current?.classList.remove('is-held');
  };

  return (
    <span
      ref={ref}
      className={`magnet${word.tile ? ' magnet--colour' : ''}`}
      style={{ '--tilt': `${tilt}deg`, '--tile': word.tile, '--ink': word.ink } as CSSProperties}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {word.text}
    </span>
  );
}

export default function BeliefMagnets() {
  const [resets, setResets] = useState(0);
  return (
    <div className="magnets">
      <ul className="magnets__lines">
        {LINES.map((line, li) => (
          <li key={line[0].text}>
            {line.map((word, wi) => (
              <Magnet key={wi} word={word} tilt={TILT[(li * 3 + wi) % TILT.length]} resets={resets} />
            ))}
          </li>
        ))}
      </ul>
      <p className="magnets__hint">
        the words come off. rearrange at will.{' '}
        <button type="button" className="magnets__reset" onClick={() => setResets((n) => n + 1)}>
          reset here.
        </button>
      </p>
    </div>
  );
}
