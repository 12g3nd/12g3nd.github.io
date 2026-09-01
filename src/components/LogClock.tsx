import { useState, useEffect } from 'react';

/* A live HH:MM:SS.mmm readout for the TRANSMISSIONS log chrome.
 *
 * Its own component on purpose: the state lives here, so a tick re-renders this
 * span alone instead of the whole Blog page and every post row under it.
 *
 * The milliseconds are theatre — they sell "live log stream" — but they used to
 * be driven at 47ms, which is ~21 renders a second to animate a number nobody
 * reads. 250ms keeps the field visibly moving (the ms digits still change every
 * tick) at a twelfth of the work. */

const TICK_MS = 250;

function stamp(): string {
  const now = new Date();
  const clock = now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `${clock}.${now.getMilliseconds().toString().padStart(3, '0')}`;
}

export default function LogClock() {
  // Seeded so the first paint is a real time, not the LOADING... placeholder
  // the interval used to leave on screen for its first tick.
  const [time, setTime] = useState(stamp);

  useEffect(() => {
    const id = setInterval(() => setTime(stamp()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  return <span className="time-display">{time}</span>;
}
