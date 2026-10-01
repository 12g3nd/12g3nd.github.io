import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

import PageTransition from '../components/PageTransition';
import AsciiRipple from '../components/AsciiRipple';
import { AMBIENT } from '../effects';
import PartyOverlay from '../components/PartyOverlay';
import WhimsyOverlay from '../components/WhimsyOverlay';
import GuestbookCard from '../components/GuestbookCard';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { routeMeta } from '../data/routeMeta';
import useGuestbook from '../hooks/useGuestbook';
import { age } from '../utils/time';
import './home/index.css';

const EMAIL = 'srihith.jarabana@mail.utoronto.ca';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Enter / Space on a role="button" element, the way a real button behaves. */
const activate = (e: KeyboardEvent, fn: () => void) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

// The hero feeds out like a printout once per browser session — the page's one
// authored motion. Decided once at module load so a re-mount on navigating back
// home does not print it again.
const PRINT_KEY = 'sjsys_printed';
const shouldPrint = (() => {
  if (typeof window === 'undefined' || prefersReducedMotion()) return false;
  try {
    if (sessionStorage.getItem(PRINT_KEY) === '1') return false;
    sessionStorage.setItem(PRINT_KEY, '1');
  } catch {
    return false;
  }
  return true;
})();

export default function Home() {
  // Hovering (or tapping) the plate swaps the CN Tower for the Statue of Liberty.
  const [showSoL, setShowSoL] = useState(false);

  // Clicking "elevators" in the fact sheet drops a tiny elevator + shakes the row.
  const [elevatorDropping, setElevatorDropping] = useState(false);
  const elevatorTimer = useRef(0);
  const dropElevator = () => {
    window.clearTimeout(elevatorTimer.current);
    setElevatorDropping(false);
    requestAnimationFrame(() => setElevatorDropping(true));
    elevatorTimer.current = window.setTimeout(() => setElevatorDropping(false), 1300);
  };

  // 'SJ' in the intro inks the S and J of the name in ribbon red for a moment.
  const [sjGlow, setSjGlow] = useState(false);
  const sjGlowTimer = useRef<number>(0);
  const triggerSjGlow = () => {
    window.clearTimeout(sjGlowTimer.current);
    setSjGlow(true);
    sjGlowTimer.current = window.setTimeout(() => setSjGlow(false), 1800);
  };

  // Clicking the Y2K star fires "whimsy mode": the star spins, the party recolor
  // + confetti kick in, and a full-bleed splash takes over for a few seconds.
  // The whole thing tears itself down after ~20s. Reduced-motion visitors get a
  // calmer, shorter version (no spin/confetti/strobe).
  const [partyActive, setPartyActive] = useState(false);
  const [splashActive, setSplashActive] = useState(false);
  const [calmMode, setCalmMode] = useState(false);
  const [smileyActive, setSmileyActive] = useState(false);
  const whimsyTimers = useRef<number[]>([]);

  const triggerWhimsy = () => {
    if (partyActive || splashActive) return;
    const calm = prefersReducedMotion();
    setCalmMode(calm);
    setSplashActive(true);

    const partyDelay   = calm ? 99999 : 3000;
    const splashLife   = calm ? 5000  : 6000;
    const sequenceLife = calm ? 5000  : 20000;

    whimsyTimers.current.push(
      window.setTimeout(() => {
        setPartyActive(true);
        document.body.classList.add('party-mode');
      }, partyDelay),
      window.setTimeout(() => setSplashActive(false), splashLife),
      window.setTimeout(() => {
        setPartyActive(false);
        document.body.classList.remove('party-mode');
      }, sequenceLife),
      window.setTimeout(() => setSmileyActive(true), 0),
      window.setTimeout(() => setSmileyActive(false), splashLife),
    );
  };

  // Don't strand the body class or leave timers running if we unmount mid-party.
  useEffect(
    () => () => {
      whimsyTimers.current.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(sjGlowTimer.current);
      window.clearTimeout(elevatorTimer.current);
      document.body.classList.remove('party-mode');
    },
    []
  );

  const fireCrt = () => window.dispatchEvent(new CustomEvent('sjsys:crt'));

  // Guestbook preview — the 3 most recent approved entries. useGuestbook caches
  // in module memory, so /guestbook reuses this fetch. `error` is read so an
  // unreachable Worker is never mistaken for an empty log.
  const {
    entries: guestbookEntries,
    loading: guestbookLoading,
    error: guestbookError,
    retry: retryGuestbook,
  } = useGuestbook();
  const previewEntries = guestbookEntries.slice(0, 3);

  useDocumentMeta(routeMeta.home.title, routeMeta.home.description);

  return (
    <PageTransition>
      {/* Portal to <body>: PageTransition is a framer-motion transform, which
          would otherwise become the containing block for these position:fixed
          overlays and strand them below the fold. */}
      {partyActive && !calmMode && createPortal(<PartyOverlay />, document.body)}
      {splashActive && createPortal(<WhimsyOverlay calm={calmMode} />, document.body)}
      {smileyActive && createPortal(
        <img src="/smileyface.png" className="whimsy-smiley" alt="" aria-hidden="true" />,
        document.body
      )}

      {/* ── The name block ─────────────────────────────────────────────── */}
      <section className={`home-hero${shouldPrint ? ' home-hero--printing' : ''}`}>
        {AMBIENT.asciiRipple && <AsciiRipple />}

        <div className="home-hero__text">
          <h1 className="home-name">
            <span className="home-name__line">
              <span className={sjGlow ? 'letter-inked' : undefined}>S</span>rihith
              <img
                src="/y2k1.png"
                alt="Activate whimsy mode"
                className={`y2k-accent${partyActive && !calmMode ? ' y2k-spinning' : ''}`}
                role="button"
                tabIndex={0}
                draggable={false}
                onClick={triggerWhimsy}
                onKeyDown={(e) => activate(e, triggerWhimsy)}
              />
            </span>
            <span className="home-name__line home-name__line--outline">
              <span className={sjGlow ? 'letter-inked' : undefined}>J</span>arabana
            </span>
          </h1>
          <p className="home-phonetic t-data">/sriːhɪθ dʒʊəˌræˈbɑːnə/</p>

          <p className="home-lede">
            '<span
              role="button"
              tabIndex={0}
              className="sj-trigger"
              onClick={triggerSjGlow}
              onKeyDown={(e) => activate(e, triggerSjGlow)}
            >SJ</span>' also welcome. {age()}, Rotman Commerce '29 at the University
            of Toronto, businessman by craft. This is my personal corner of the internet.
          </p>

          <p className="home-program">
            <img
              src="/crest.png"
              alt="Fire a CRT burst"
              className="crest-icon"
              role="button"
              tabIndex={0}
              draggable={false}
              onClick={fireCrt}
              onKeyDown={(e) => activate(e, fireCrt)}
            />
            <span>
              Intended: Management Specialist, focus in finance, minor in statistics
              and economics.
            </span>
          </p>

          <ul className="home-actions">
            <li>
              <a href="/resume.pdf" target="_blank" rel="noopener noreferrer">
                Résumé <span className="home-actions__kind">PDF ↗</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${EMAIL}`}>
                Email <span className="home-actions__kind">{EMAIL}</span>
              </a>
            </li>
            <li>
              <Link to="/projects">
                Projects <span className="home-actions__kind">→</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* The plate holds the photo spot until there is a photo. Hover or tap
            swaps the CN Tower for the Statue of Liberty; both images are always
            in the DOM so the swap is instant and the box never reflows. */}
        <figure
          className={`home-plate${showSoL ? ' home-plate--swapped' : ''}`}
          onMouseEnter={() => setShowSoL(true)}
          onMouseLeave={() => setShowSoL(false)}
          onClick={() => setShowSoL((v) => !v)}
        >
          <div className="home-plate__art">
            <img src="/CNtower.png" alt="Engraving of the CN Tower" className="home-plate__img home-plate__img--tower" />
            <img src="/SoL.png" alt="Engraving of the Statue of Liberty" className="home-plate__img home-plate__img--liberty" />
          </div>
          <figcaption className="t-data">
            fig. 1 — {showSoL ? 'the other one' : 'CN Tower (hover)'}
          </figcaption>
        </figure>

        <aside className="index-card" aria-labelledby="wiu-title">
          <h2 id="wiu-title" className="index-card__title">What I'm up to</h2>
          <p>
            Building financial models using agentic iteration (e.g. SQL and .pbip),
            starting sophomore year, and exploring career options.
          </p>
          <p className="index-card__stamp t-data">as of 9.1.26</p>
        </aside>
      </section>

      {/* ── Tenets ─────────────────────────────────────────────────────── */}
      <section className="home-section tenets" aria-labelledby="tenets-title">
        <header className="home-section__head">
          <h2 id="tenets-title">Tenets</h2>
          <p className="home-section__note t-data">rev. 0.3 — subject to revision without notice</p>
        </header>
        <dl className="tenets__list">
          <div className="tenets__item">
            <dt>The false equivalence</dt>
            <dd>
              Being content isn't being happy. Content means nothing hurts. Happy means
              something's alive. The dangerous part is how similar they feel from the inside.
            </dd>
          </div>
          <div className="tenets__item">
            <dt>The mundane, entertained</dt>
            <dd>
              Trying to never be bored is a mistake. A commute, a queue, a slow Tuesday
              afternoon. Anything gets interesting if you stare at it long enough.
            </dd>
          </div>
          <div className="tenets__item">
            <dt>The alternative hypothesis</dt>
            <dd>
              The plan will change. What matters is whether you change with it or stand
              there mourning past potential. "Life, uh, finds a way."
            </dd>
          </div>
        </dl>
      </section>

      {/* ── Beliefs + the quote ────────────────────────────────────────── */}
      <section className="home-section beliefs" aria-labelledby="beliefs-title">
        <div className="beliefs__col">
          <h2 id="beliefs-title" className="sr-only">Core beliefs</h2>
          <ul className="beliefs__list">
            <li>Art is political.</li>
            <li>Business is personal.</li>
            <li>Technology is philosophy.<sup aria-hidden="true">*</sup></li>
          </ul>
          <p className="beliefs__footnote">
            <span aria-hidden="true">* </span>Three things I'll probably over-defend at a
            party, but I feel an imperative need to for some reason.
          </p>
          <a
            href="https://en.wikipedia.org/wiki/Mysterium_Cosmographicum"
            target="_blank"
            rel="noopener noreferrer"
            className="kepler-link"
          >
            <img src="/Kepler.png" alt="Kepler's Mysterium Cosmographicum, the nested-solids model of the solar system" />
          </a>
        </div>

        <figure className="clipping">
          <blockquote>
            <p>"It is the mark of an educated mind to entertain a thought without accepting it."</p>
          </blockquote>
          <figcaption>
            — <a
              href="https://sententiaeantiquae.com/2018/09/22/nope-aristotle-did-not-say-it-is-the-mark-of-an-educated-mind-to-entertain-a-thought-without/"
              target="_blank"
              rel="noopener noreferrer"
            >(probably not) Aristotle</a>
          </figcaption>
          <img src="/Aristotle.jpg" alt="Engraved portrait of Aristotle" className="clipping__portrait" loading="lazy" decoding="async" />
        </figure>
      </section>

      {/* ── Fact sheet ─────────────────────────────────────────────────── */}
      <section className="home-section facts" aria-labelledby="facts-title">
        <h2 id="facts-title">Fact sheet</h2>
        <dl className="facts__sheet">
          <div className="facts__row">
            <dt className="t-data">Hobbies</dt>
            <dd>Writing (poetry, flash fiction, whatever), rating root beers, world history and politics.</dd>
          </div>
          <div className="facts__row">
            <dt className="t-data">Pet peeves</dt>
            <dd>Lack of turn signals, inconsiderateness, "could of."</dd>
          </div>
          <div className={`facts__row facts__row--fun${elevatorDropping ? ' elevator-dropping' : ''}`}>
            <dt className="t-data">Fun facts</dt>
            <dd>
              Afraid of{' '}
              <span
                className="elevator-trigger"
                role="button"
                tabIndex={0}
                onClick={dropElevator}
                onKeyDown={(e) => activate(e, dropElevator)}
              >
                elevators
              </span>
              . Collects Japanese mechanical pencils. Double jointed in both thumbs.
            </dd>
            {elevatorDropping && <span className="falling-elevator" aria-hidden="true">▯</span>}
          </div>
        </dl>
      </section>

      {/* ── Guestbook preview ──────────────────────────────────────────── */}
      <section className="home-section guestbook-preview" aria-labelledby="gb-title">
        <header className="home-section__head">
          <h2 id="gb-title">Guestbook</h2>
          <p className="home-section__note">Visitors who've left their mark: a signature and three words.</p>
        </header>

        <div className="guestbook-preview__grid">
          {guestbookLoading &&
            [0, 1, 2].map((i) => <div key={i} className="gb-skeleton" aria-hidden="true" />)}

          {!guestbookLoading && guestbookError && (
            <div className="guestbook-preview__notice" role="status">
              <p>The guestbook isn't answering right now. The entries are safe; it's the connection.</p>
              <button type="button" onClick={retryGuestbook}>Try again</button>
            </div>
          )}

          {!guestbookLoading && !guestbookError && previewEntries.length === 0 && (
            <div className="guestbook-preview__notice">
              <p>No entries yet. Be the first.</p>
            </div>
          )}

          {!guestbookLoading &&
            !guestbookError &&
            previewEntries.map((entry) => <GuestbookCard key={entry.id} entry={entry} compact />)}
        </div>

        <p className="guestbook-preview__more">
          <Link to="/guestbook">
            {guestbookEntries.length > 3
              ? `Read all ${guestbookEntries.length} entries and sign`
              : 'Read the guestbook and sign'}{' '}
            →
          </Link>
        </p>
      </section>

      {/* ── Contact ────────────────────────────────────────────────────── */}
      <section className="home-section contact" aria-labelledby="contact-title">
        <h2 id="contact-title">Write to me</h2>
        <a className="contact__email" href={`mailto:${EMAIL}`}>{EMAIL}</a>
        <ul className="contact__elsewhere">
          <li><a href="https://www.linkedin.com/in/srihithjarabana/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></li>
          <li><a href="https://github.com/12g3nd" target="_blank" rel="noopener noreferrer">GitHub ↗</a></li>
          <li><a href="https://www.instagram.com/sssrihith/" target="_blank" rel="noopener noreferrer">Instagram ↗</a></li>
        </ul>
      </section>
    </PageTransition>
  );
}
