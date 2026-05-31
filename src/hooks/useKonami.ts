import { useEffect, useRef } from 'react';

const SEQUENCE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
];

/** Fires `onTrigger` when the Konami code is entered. Tolerant of a wrong key
   mid-sequence: it restarts from 0 (or 1 if the wrong key was itself an ↑). */
export default function useKonami(onTrigger: () => void) {
  const index = useRef(0);
  const handler = useRef(onTrigger);
  handler.current = onTrigger;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === SEQUENCE[index.current]) {
        index.current += 1;
        if (index.current === SEQUENCE.length) {
          index.current = 0;
          handler.current();
        }
      } else {
        index.current = key === SEQUENCE[0] ? 1 : 0;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
