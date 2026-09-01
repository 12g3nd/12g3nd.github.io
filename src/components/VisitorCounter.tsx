import { useEffect, useState } from 'react';
import { WORKER_URL } from '../hooks/useGuestbook';

/* A session counter, built rather than installed.
 *
 * The whole mechanism: once per browser session, POST to the Worker, which
 * increments one integer in D1 and returns it. Repeat views in the same
 * session read the number instead of adding to it.
 *
 * There is no cookie, no fingerprint, no stored IP, no identifier of any kind.
 * The only state about a visitor lives in that visitor's own sessionStorage and
 * says nothing except "this tab already counted itself".
 *
 * The label reads VISITS rather than VISITORS for that reason: one session is
 * one visit, and the same person returning tomorrow is counted again. Claiming
 * unique humans would need exactly the tracking this deliberately does not do.
 */

/** Per-tab flag: present once this session has been counted. */
const SESSION_KEY = 'sjsys_counted';

/** The counter was zeroed on this date; every digit since is one we counted. */
const SINCE = '2026.09';

/**
 * Easter egg on the number itself: xkcd 901, "Temperature" — the one about a
 * y-axis cropped until a meaningless wobble looks like an emergency. It is the
 * correct footnote for any counter in any footer, including this one.
 *
 * Deliberately not signposted. No underline, no tooltip, nothing that says
 * "click me" — the cursor turning into a pointer is the whole hint. The
 * aria-label carries the real meaning for anyone who is not going to see a
 * hover state anyway.
 */
const XKCD = 'https://xkcd.com/901';

/** Six digits, so the readout never changes width as the count rolls over. */
const WIDTH = 6;

/** sessionStorage throws outright in some privacy modes rather than no-opping. */
function alreadyCounted(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function markCounted(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* Counting twice is a better failure than crashing the footer. */
  }
}

/**
 * Cached for the life of the page load, so the counter can be incremented at
 * most once no matter how many times the component mounts.
 *
 * This is not a StrictMode workaround, though it fixes that too: StrictMode
 * double-invokes effects in development and would otherwise add two to the
 * count on every dev page load. The real point is that "increment" is not
 * idempotent, so the request must not be tied to a component lifecycle that is
 * allowed to run more than once. One page load, one write.
 */
let pending: Promise<number | null> | null = null;

function requestCount(): Promise<number | null> {
  if (pending) return pending;

  const counted = alreadyCounted();
  const url = counted ? `${WORKER_URL}/visits` : `${WORKER_URL}/visit`;

  pending = fetch(url, counted ? undefined : { method: 'POST' })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
    .then((data: { count?: unknown }) => {
      if (typeof data.count !== 'number') return null;
      if (!counted) markCounted();
      return data.count;
    })
    .catch(() => {
      /* Worker down, offline, or a blocker ate the request. The readout keeps
         its placeholder dashes rather than inventing a number or vanishing and
         reflowing the footer. */
      return null;
    });

  return pending;
}

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    requestCount().then((value) => {
      if (live && value !== null) setCount(value);
    });
    return () => {
      live = false;
    };
  }, []);

  const readout = count === null ? '-'.repeat(WIDTH) : String(count).padStart(WIDTH, '0');

  return (
    <p className="visitor-counter">
      <span className="visitor-counter__label">VISITS:</span>{' '}
      <a
        className="visitor-counter__value"
        href={XKCD}
        target="_blank"
        rel="noreferrer"
        aria-busy={count === null}
        aria-label={
          count === null
            ? 'Visit count unavailable. Link to xkcd 901.'
            : `${count} visits since ${SINCE.replace('.', '-')}. Link to xkcd 901.`
        }
      >
        {readout}
      </a>
      <span className="visitor-counter__since">SINCE {SINCE}</span>
    </p>
  );
}
