import './PartyOverlay.css';

const EMOJI = ['🦄', '🌈', '✨', '💖', '⭐', '🍭', '🎉', '🪩', '🦄', '🌈', '✨', '🌟'];

/* Laid out once when the module loads rather than inside the component.
   Math.random() during render is a side effect — React may render a tree it
   then discards, so nothing in a render body is allowed to be the thing that
   decides where the confetti goes. Hoisting it here also means the swarm is
   scattered exactly once per page load instead of on every mount, which for
   sixteen drifting unicorns is indistinguishable. */
const ITEMS = Array.from({ length: 16 }).map((_, i) => ({
  emoji: EMOJI[i % EMOJI.length],
  left: Math.random() * 100,
  delay: Math.random() * 6,
  duration: 6 + Math.random() * 7,
  size: 1.4 + Math.random() * 2.2,
}));

/* `party mode` payload: a swarm of unicorns/rainbows/sparkles drifting up the
   screen. The whole-site recolor lives in index.css (body.party-mode); this is
   just the confetti layer. Decorative — never intercepts pointer events. */
export default function PartyOverlay() {
  return (
    <div className="party-overlay" aria-hidden="true">
      {ITEMS.map((it, i) => (
        <span
          key={i}
          className="party-emoji"
          style={{
            left: `${it.left}%`,
            fontSize: `${it.size}rem`,
            animationDelay: `${it.delay}s`,
            animationDuration: `${it.duration}s`,
          }}
        >
          {it.emoji}
        </span>
      ))}
    </div>
  );
}
