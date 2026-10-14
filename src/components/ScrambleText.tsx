import { useEffect, useRef, useState } from 'react';

const CHARS = '!<>-_\\/[]{}=+*^?#%@01';

interface ScrambleTextProps {
  text: string;
  className?: string;
  /** Characters from this index on are wrapped in `.accent`, so a heading can
   *  carry a second colour ("Guest" + "book") through the scramble. */
  accentFrom?: number;
}

/**
 * "Decrypts" its text on mount: each character scrambles through random glyphs,
 * then settles to its final value in a left-to-right stagger. Respects
 * prefers-reduced-motion (renders the final text immediately).
 *
 * The glyphs are for the eye only: a screen reader landing on the heading
 * mid-scramble would otherwise read out "Guestb-?1". It gets the final text
 * from a hidden copy, and the animated one is aria-hidden.
 */
export default function ScrambleText({ text, className, accentFrom }: ScrambleTextProps) {
  const [display, setDisplay] = useState(text);
  const raf = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(text);
      return;
    }

    const total = text.length;
    // each char locks in at frame i*2 + 8
    const settleEnd = text.split('').map((_, i) => i * 2 + 8);
    let frame = 0;

    const tick = () => {
      let out = '';
      let done = 0;
      for (let i = 0; i < total; i++) {
        if (text[i] === ' ') {
          out += ' ';
          done++;
        } else if (frame >= settleEnd[i]) {
          out += text[i];
          done++;
        } else {
          out += CHARS[(Math.random() * CHARS.length) | 0];
        }
      }
      setDisplay(out);
      frame++;
      if (done < total) {
        raf.current = requestAnimationFrame(tick);
      }
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [text]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {accentFrom === undefined ? (
        <span aria-hidden="true">{display}</span>
      ) : (
        <span aria-hidden="true">
          {display.slice(0, accentFrom)}
          <span className="accent">{display.slice(accentFrom)}</span>
        </span>
      )}
    </span>
  );
}
