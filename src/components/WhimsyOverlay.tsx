import './WhimsyOverlay.css';

/* The full-bleed splash fired by clicking the Y2K star on the Home hero.
   Text fills the entire viewport, slightly tilted, over a strobing rainbow.
   Decorative only — pointer-events are off so it never traps a click.
   `calm` drops the strobe/slam for prefers-reduced-motion visitors: the words
   just fade in and hold. Mount/unmount is owned by Home (it controls timing). */
const WORDS = ['LIFE NEEDS A', 'BIT OF', 'WHIMSY,', 'NOW', 'AND THEN'];

export default function WhimsyOverlay({ calm = false }: { calm?: boolean }) {
  return (
    <div className={`whimsy-overlay${calm ? ' whimsy-overlay--calm' : ''}`} aria-hidden="true">
      <div className="whimsy-words">
        {WORDS.map((word, i) => (
          <span
            key={word}
            className="whimsy-word"
            style={{ animationDelay: `${i * 0.12}s` }}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}
