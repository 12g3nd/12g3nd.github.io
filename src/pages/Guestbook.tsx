import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import ScrambleText from '../components/ScrambleText';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { routeMeta } from '../data/routeMeta';
import useGuestbook from '../hooks/useGuestbook';
import GuestbookCard from '../components/GuestbookCard';
import GuestbookForm from '../components/GuestbookForm';
import './Guestbook.css';

export default function Guestbook() {
  const { entries, loading, error } = useGuestbook();

  useDocumentMeta(routeMeta.guestbook.title, routeMeta.guestbook.description);

  const count = entries.length;

  return (
    <PageTransition>
      <section className="section">
        <div className="section-header">
          <h2>
            <ScrambleText text="GUESTBOOK_" />
          </h2>
          <p className="section-desc">
            visitors who've left their mark (drawn signatures &amp; three words)
          </p>
        </div>

        {/* Sign first: the form leads, the existing entries follow below it. */}
        <GuestbookForm />

        {/* Command chrome — `cat guestbook.log`, matching pkg-bar / poetry-bar. */}
        <div className="guestbook-bar">
          <span className="guestbook-bar__cmd">
            <span className="guestbook-bar__prompt">srihith@sj.sys:~$</span> cat guestbook.log
          </span>
          <span className="guestbook-bar__count">
            {loading ? '· · ·' : `${count} ${count === 1 ? 'entry' : 'entries'}`}
          </span>
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
                <GuestbookCard entry={entry} />
              </Reveal>
            ))}
        </div>
      </section>
    </PageTransition>
  );
}
