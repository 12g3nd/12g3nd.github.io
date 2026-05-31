import { useMemo } from 'react';
import './PartyOverlay.css';

const EMOJI = ['🦄', '🌈', '✨', '💖', '⭐', '🍭', '🎉', '🪩', '🦄', '🌈', '✨', '🌟'];

/* `party mode` payload: a swarm of unicorns/rainbows/sparkles drifting up the
   screen. The whole-site recolor lives in index.css (body.party-mode); this is
   just the confetti layer. Decorative — never intercepts pointer events. */
export default function PartyOverlay() {
  const items = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        emoji: EMOJI[i % EMOJI.length],
        left: Math.random() * 100,
        delay: Math.random() * 6,
        duration: 6 + Math.random() * 7,
        size: 1.4 + Math.random() * 2.2,
      })),
    []
  );

  return (
    <div className="party-overlay" aria-hidden="true">
      {items.map((it, i) => (
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
