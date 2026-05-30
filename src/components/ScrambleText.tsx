import { useEffect, useRef, useState } from 'react';

const CHARS = '!<>-_\\/[]{}=+*^?#%@01';

interface ScrambleTextProps {
  text: string;
  className?: string;
}

/**
 * "Decrypts" its text on mount: each character scrambles through random glyphs,
 * then settles to its final value in a left-to-right stagger. Respects
 * prefers-reduced-motion (renders the final text immediately).
 */
export default function ScrambleText({ text, className }: ScrambleTextProps) {
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

  return <span className={className}>{display}</span>;
}
