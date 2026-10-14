import { useState } from 'react';
import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import StationHeader from '../components/StationHeader';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { routeMeta } from '../data/routeMeta';
import useGuestbook from '../hooks/useGuestbook';
import GuestbookCard from '../components/GuestbookCard';
import GuestbookForm from '../components/GuestbookForm';
import './guestbook/index.css';

export default function Guestbook() {
  const { entries, loading, error } = useGuestbook();

  /* Not persisted on purpose. Hidden is the state this page should open in
     every time — remembering one curious click would quietly make the reveal
     the default forever. */
  const [showDates, setShowDates] = useState(false);

  useDocumentMeta(routeMeta.guestbook.title, routeMeta.guestbook.description);

  const count = entries.length;

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

        <div className="page-tools guestbook-tools">
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
          </div>
        </div>

        <div className="guestbook-grid">
          {loading &&
            [0, 1, 2].map((i) => <div key={i} className="gb-skeleton" aria-hidden="true" />)}

          {!loading && error && (
            <div className="gb-notice">[ COULDN'T REACH THE LOG — {error} ]</div>
          )}

          {!loading && !error && count === 0 && (
            <div className="gb-notice">[ NO ENTRIES YET, be the first. ]</div>
          )}

          {!loading &&
            !error &&
            entries.map((entry, i) => (
              <Reveal key={entry.id} delay={Math.min(i, 6) * 0.07}>
                <GuestbookCard entry={entry} showDate={showDates} />
              </Reveal>
            ))}
        </div>
      </section>
    </PageTransition>
  );
}
