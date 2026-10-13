import { useRef, type CSSProperties, type PointerEvent } from 'react';
import Reveal from './Reveal';
import './TenetCards.css';

/**
 * The tenets as trading cards: a coloured frame in a nav line colour, a title
 * bar, the number as the card's "art", a type line, the tenet as the card text.
 * Everything is on the front, so nothing has to be flipped to be read.
 *
 * The holo is three layers: a foil band across the art window, a fainter one
 * across the whole card, and a glare spot. With a mouse over the card all three
 * follow the pointer and the card tilts toward it; otherwise the foil drifts on
 * its own. Under reduced motion it holds still and never tilts.
 */

const TENETS = [
  {
    n: '01',
    title: 'The false equivalence',
    type: 'On feeling',
    line: '#00a54f',
    body: "Being content ≠ being happy. Content means nothing hurts. Happy means something's alive. The dangerous part is how similar they feel from the inside.",
  },
  {
    n: '02',
    title: 'The mundane entertained',
    type: 'On attention',
    line: '#ffc41e',
    body: 'Trying to never be bored is a mistake. A commute, a queue, a slow Tuesday afternoon. Anything gets interesting if you stare at it long enough.',
  },
  {
    n: '03',
    title: 'The alternative hypothesis',
    type: 'On change',
    line: '#ff2e4d',
    body: 'The plan will change. What matters is whether you change with it or stand there mourning past potential. "Life, uh, finds a way."',
  },
] as const;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function TenetCard({ tenet }: { tenet: (typeof TENETS)[number] }) {
  const ref = useRef<HTMLElement | null>(null);

  // Written straight to the element's style: a re-render per pointer move
  // would be wasted work for four custom properties.
  const onMove = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
    if (!reducedMotion()) {
      el.style.setProperty('--rx', `${(x - 0.5) * 16}deg`);
      el.style.setProperty('--ry', `${(0.5 - y) * 12}deg`);
    }
    el.classList.add('is-live');
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.classList.remove('is-live');
  };

  return (
    <article
      ref={ref}
      className="tcard"
      style={{ '--c': tenet.line } as CSSProperties}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="tcard__in">
        <header className="tcard__bar">
          <h3>{tenet.title}</h3>
          <span>v0.3</span>
        </header>
        <div className="tcard__art" aria-hidden="true">
          <span className="tcard__foil" />
          <b>{tenet.n}</b>
        </div>
        <p className="tcard__type">Tenet: {tenet.type}</p>
        <p className="tcard__text">{tenet.body}</p>
        <footer className="tcard__foot">
          <span>subject to revision</span>
          <img src="/y2k1.png" alt="" />
        </footer>
      </div>
      <span className="tcard__holo" aria-hidden="true" />
      <span className="tcard__glare" aria-hidden="true" />
    </article>
  );
}

export default function TenetCards() {
  return (
    <div className="tenets-grid">
      {TENETS.map((t, i) => (
        <Reveal key={t.n} delay={i * 0.1}>
          <TenetCard tenet={t} />
        </Reveal>
      ))}
    </div>
  );
}
