import { useEffect, useRef, useState } from 'react';
import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import StationHeader from '../components/StationHeader';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { routeMeta } from '../data/routeMeta';
import useGuestbook from '../hooks/useGuestbook';
import GuestbookCard from '../components/GuestbookCard';
import GuestbookForm from '../components/GuestbookForm';
import './guestbook/index.css';

/* Three rows of the three-up grid. */
const PAGE_SIZE = 9;

export default function Guestbook() {
  const { entries, loading, error, retry } = useGuestbook();

  /* Not persisted on purpose. Hidden is the state this page should open in
     every time — remembering one curious click would quietly make the reveal
     the default forever. */
  const [showDates, setShowDates] = useState(false);

  /* Pages by default, so the log has an end you can see; infinite scroll for
     whoever would rather keep reading. Also not persisted, for the same
     reason as the dates. */
  const [infinite, setInfinite] = useState(false);
  const [page, setPage] = useState(0);
  const [shown, setShown] = useState(PAGE_SIZE);

  const logRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useDocumentMeta(routeMeta.guestbook.title, routeMeta.guestbook.description);

  const count = entries.length;
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = infinite
    ? entries.slice(0, shown)
    : entries.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);
  const paged = count > PAGE_SIZE;

  // Infinite: the next nine arrive as the bottom of the list comes near.
  useEffect(() => {
    if (!infinite) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setShown((n) => Math.min(n + PAGE_SIZE, count));
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [infinite, count]);

  const goTo = (p: number) => {
    setPage(p);
    logRef.current?.scrollIntoView({ block: 'start' });
  };

  const toggleInfinite = () => {
    if (infinite) {
      setInfinite(false);
      setPage(0);
    } else {
      // Keep what is already on screen: the scroll picks up after this page.
      setShown((current + 1) * PAGE_SIZE);
      setInfinite(true);
    }
  };

  return (
    <PageTransition>
      <section className="section line--guestbook">
        <StationHeader
          line="guestbook"
          name="Guestbook"
          file="guestbook.log"
          accentFrom={5}
          desc="visitors who've left their mark (drawn signatures & three words)"
        />

        {/* Sign first: the form leads, the existing entries follow below it. */}
        <GuestbookForm />

        <div className="page-tools guestbook-tools" ref={logRef}>
          <div className="page-tools__group">
            <h2>The log</h2>
            <span>{loading ? '· · ·' : `${count} ${count === 1 ? 'entry' : 'entries'}`}</span>
          </div>
          <div className="page-tools__group">
            <button
              type="button"
              className="tool-toggle"
              onClick={() => setShowDates((v) => !v)}
              aria-pressed={showDates}
            >
              Show dates
            </button>
            {paged && (
              <button type="button" className="tool-toggle" onClick={toggleInfinite} aria-pressed={infinite}>
                Infinite scroll
              </button>
            )}
          </div>
        </div>

        <div className="guestbook-grid">
          {loading &&
            [0, 1, 2].map((i) => <div key={i} className="gb-skeleton" aria-hidden="true" />)}

          {!loading && error && (
            // The browser's own message ("Failed to fetch") means nothing to a
            // visitor; it stays in the tooltip for whoever is debugging.
            <div className="gb-notice" role="status" title={error}>
              The log is offline for a moment.{' '}
              <button type="button" className="gb-retry" onClick={retry}>Try again</button>
            </div>
          )}

          {!loading && !error && count === 0 && (
            <div className="gb-notice">No entries yet. Be the first.</div>
          )}

          {!loading &&
            !error &&
            visible.map((entry, i) => (
              <Reveal key={entry.id} delay={Math.min(i, 6) * 0.07}>
                <GuestbookCard entry={entry} showDate={showDates} />
              </Reveal>
            ))}
        </div>

        {!loading && !error && paged && !infinite && (
          <nav className="gb-pager" aria-label="Guestbook pages">
            <button type="button" className="gb-pager__step" onClick={() => goTo(current - 1)} disabled={current === 0}>
              ← Newer
            </button>
            <ol className="gb-pager__pages">
              {Array.from({ length: pages }, (_, p) => (
                <li key={p}>
                  <button
                    type="button"
                    className="gb-pager__page"
                    onClick={() => goTo(p)}
                    aria-current={p === current ? 'page' : undefined}
                    aria-label={`Page ${p + 1}`}
                  >
                    {p + 1}
                  </button>
                </li>
              ))}
            </ol>
            <button type="button" className="gb-pager__step" onClick={() => goTo(current + 1)} disabled={current === pages - 1}>
              Older →
            </button>
          </nav>
        )}

        {!loading && !error && paged && infinite && (
          <div className="gb-more" ref={sentinelRef}>
            {shown < count ? (
              // The observer loads as you near the end; the button is for
              // keyboards, and for anything that never scrolls.
              <button type="button" className="gb-pager__step" onClick={() => setShown((n) => Math.min(n + PAGE_SIZE, count))}>
                Load more · {Math.min(shown, count)} of {count}
              </button>
            ) : (
              <span>That's everyone. {count} entries.</span>
            )}
          </div>
        )}
      </section>
    </PageTransition>
  );
}
