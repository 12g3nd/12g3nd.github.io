import { useEffect, useMemo, useRef, useState } from 'react';
import { isLateNight } from '../utils/time';
import './BootSequence.css';

/* SJ.SYS power-on self test. Shows once per browser session (sessionStorage),
   fully skippable, and never runs for prefers-reduced-motion users — App gates
   it on both before this ever mounts. The lines are diegetic: the site frames
   itself as an operating system, so it boots like one. */

type Line = {
  text?: string;
  tag?: string;
  tone?: 'ok' | 'warn';
  spacer?: boolean;
  strong?: boolean;
  dim?: boolean;
};

// The caffeine readout is live: between 1–5am visitor-local it drops from LOW
// to CRITICAL, and an extra diegetic line appears. Built per-mount so it
// reflects the actual hour the page booted.
function buildLines(lateNight: boolean): Line[] {
  return [
    { text: 'SJ.SYS // POWER-ON SELF TEST', strong: true },
    { text: 'BIOS v0.3.0 — Rotman Commerce build', dim: true },
    { spacer: true },
    { text: '> initializing kernel ............', tag: 'OK', tone: 'ok' },
    { text: '> mounting /projects .............', tag: 'OK', tone: 'ok' },
    { text: '> mounting /poetry ...............', tag: 'OK', tone: 'ok' },
    { text: '> mounting /media ................', tag: 'OK', tone: 'ok' },
    { text: '> loading personality.dll ........', tag: 'OK', tone: 'ok' },
    { text: '> calibrating ambition ...........', tag: 'OK', tone: 'ok' },
    lateNight
      ? { text: '> caffeine .......................', tag: 'CRITICAL', tone: 'warn' }
      : { text: '> caffeine .......................', tag: 'LOW', tone: 'warn' },
    ...(lateNight
      ? [{ text: '> local time check ...... it is past 1am', tag: '!!', tone: 'warn' as const }]
      : []),
    { text: '> businessman detected in STEM partition', tag: '?!', tone: 'warn' },
    { spacer: true },
    { text: '> boot complete. welcome.', strong: true },
  ];
}

const LINE_INTERVAL = 130; // ms between revealed lines
const HOLD_AFTER = 750; // ms to linger on the finished screen
const FADE_MS = 450; // keep in sync with .boot--leaving transition

export default function BootSequence({ onDone }: { onDone: () => void }) {
  const LINES = useMemo(() => buildLines(isLateNight()), []);
  const [count, setCount] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const finished = useRef(false);

  // Single source of truth for ending the boot: fade out, then unmount.
  const finish = useRef(() => {});
  finish.current = () => {
    if (finished.current) return;
    finished.current = true;
    setLeaving(true);
    window.setTimeout(onDone, FADE_MS);
  };

  // Reveal lines one at a time, then hold, then finish.
  useEffect(() => {
    const reveal = window.setInterval(() => {
      setCount((c) => {
        if (c >= LINES.length) {
          window.clearInterval(reveal);
          window.setTimeout(() => finish.current(), HOLD_AFTER);
          return c;
        }
        return c + 1;
      });
    }, LINE_INTERVAL);
    return () => window.clearInterval(reveal);
  }, []);

  // Lock scroll while booting.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Any key skips straight to the site.
  useEffect(() => {
    const onKey = () => finish.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const visible = LINES.slice(0, count);
  const done = count >= LINES.length;

  return (
    <div
      className={`boot${leaving ? ' boot--leaving' : ''}`}
      onClick={() => finish.current()}
      role="presentation"
    >
      <div className="boot__screen">
        <pre className="boot__log">
          {visible.map((line, i) =>
            line.spacer ? (
              <span key={i} className="boot__line boot__line--spacer">
                {' '}
              </span>
            ) : (
              <span
                key={i}
                className={`boot__line${line.strong ? ' boot__line--strong' : ''}${
                  line.dim ? ' boot__line--dim' : ''
                }`}
              >
                <span className="boot__text">{line.text}</span>
                {line.tag && (
                  <span className={`boot__tag boot__tag--${line.tone}`}>
                    [{line.tag}]
                  </span>
                )}
              </span>
            )
          )}
          {!done && <span className="boot__cursor">█</span>}
        </pre>
        <button
          type="button"
          className="boot__skip"
          onClick={(e) => {
            e.stopPropagation();
            finish.current();
          }}
        >
          [ SKIP ▸ ]
        </button>
      </div>
    </div>
  );
}
