import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import ScrambleText from '../components/ScrambleText';
import AsciiRipple from '../components/AsciiRipple';
import PartyOverlay from '../components/PartyOverlay';
import WhimsyOverlay from '../components/WhimsyOverlay';
import GuestbookCard from '../components/GuestbookCard';
import ScratchReveal from '../components/ScratchReveal';
import Incubator from '../components/incubator/Incubator';
import PillarsMenu from '../components/PillarsMenu';
import { postsSorted } from '../data/posts';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { routeMeta } from '../data/routeMeta';
import useGuestbook from '../hooks/useGuestbook';
import useMediaQuery from '../hooks/useMediaQuery';
import { age } from '../utils/time';
import './home/index.css';

// The departures board. Each row is [label, line]; keep lines short enough to
// sit on one or two rows of the board.
const NOW_BOARD = {
  asOf: '10.13.26',
  rows: [
    ['NOW', 'Agentic iteration on Power BI reports (.pbip). Travelling, and exploring the city more.'],
    ['THIS FALL', 'Midterms. Unfortunately.'],
    ['ALSO', 'Looking into alternative career options.'],
  ],
} as const;

// The skyline: [width %, height %] per block, left to right, with the
// landmark standing in the slot at TOWER_AT. Fixed, not random, so the
// screenshot harness sees the same city every run.
const SKYLINE: ReadonlyArray<readonly [number, number]> = [
  [5, 34], [3, 58], [6, 26], [3.5, 46], [0, 0], [4, 40], [7, 30], [2.5, 64], [5, 38],
  [6, 24], [3, 52], [8, 30], [4, 44], [5.5, 28], [3, 56], [9, 22], [4.5, 36], [6, 26],
];
const TOWER_AT = 4;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Home() {
  const [showSoL, setShowSoL] = useState(false);

  // Clicking "elevators" in the fun facts drops a tiny elevator + shakes the card.
  const [elevatorDropping, setElevatorDropping] = useState(false);
  const elevatorTimer = useRef(0);
  const dropElevator = () => {
    window.clearTimeout(elevatorTimer.current);
    setElevatorDropping(false);
    requestAnimationFrame(() => setElevatorDropping(true));
    elevatorTimer.current = window.setTimeout(() => setElevatorDropping(false), 1300);
  };

  // SJ Glow: triggered by clicking the S and J letters. Adds a glow effect.
  const [sjGlow, setSjGlow] = useState(false);
  const sjGlowTimer = useRef<number>(0);
  const triggerSjGlow = () => {
    window.clearTimeout(sjGlowTimer.current);
    setSjGlow(true);
    sjGlowTimer.current = window.setTimeout(() => setSjGlow(false), 1800);
  };

  // Clicking the Y2K star fires "whimsy mode": the star spins, the existing
  // party recolor + confetti kick in, and a full-bleed splash takes over for a
  // few seconds. The whole thing tears itself down after ~20s. Reduced-motion
  // visitors get a calmer, shorter version (no spin/confetti/strobe).
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
      document.body.classList.remove('party-mode');
    },
    []
  );

  // Guestbook preview — 3 most-recent approved entries. useGuestbook caches in
  // module memory, so the full /guestbook page reuses this fetch (no second hit).
  // `error` is read here for the same reason /guestbook reads it: without it an
  // unreachable Worker is indistinguishable from an empty log, and the preview
  // invites a visitor to "be the first" into a guestbook that already has entries.
  const { entries: guestbookEntries, loading: guestbookLoading, error: guestbookError } = useGuestbook();
  const previewEntries = guestbookEntries.slice(0, 3);

  useDocumentMeta(routeMeta.home.title, routeMeta.home.description);

  // One incubator, mounted in whichever spot the layout shows: the right
  // column on desktop, inline under the program on phones. Two would mean two
  // WebGL contexts, one of them drawing into a hidden column.
  const phone = useMediaQuery('(max-width: 768px)');

  // "What I'm up to", as a departures board (edit NOW_BOARD above). It sits
  // under the incubator on desktop and after the intro on phones, where the
  // right column is hidden.
  const nowBoard = (
    <section className="dep-board" aria-labelledby="dep-board-title">
      <header className="dep-board__head">
        <h2 id="dep-board-title">What I'm up to</h2>
        <span>as of {NOW_BOARD.asOf}</span>
      </header>
      <dl className="dep-board__rows">
        {NOW_BOARD.rows.map(([when, what]) => (
          <div key={what}><dt>{when}</dt><dd>{what}</dd></div>
        ))}
      </dl>
    </section>
  );

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

      <section className="section info-section">
        <AsciiRipple />

        <div className="hero-content">
          <div className="giant-text">
            <h1 className="title-srihith">
              <span className={sjGlow ? 'letter-glow' : ''}>S</span>RIHITH
              <img
                src="/y2k1.png"
                alt="Activate whimsy mode"
                className={`y2k-accent${partyActive && !calmMode ? ' y2k-spinning' : ''}`}
                role="button"
                tabIndex={0}
                draggable={false}
                onClick={triggerWhimsy}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerWhimsy(); } }}
              />
            </h1>
            <h1 className="outline-text">
              <span className={sjGlow ? 'letter-glow' : ''}>J</span>ARABANA
            </h1>
            <p className="phonetic-text">/sriːhɪθ dʒʊəˌræˈbɑːnə/</p>
          </div>
          {/* One segmented strip: the crest (still the CRT-burst egg) as its
              first cell, so it is always centred against the text, then the
              program and the year. */}
          <div className="badge-row">
            <span className="badge-cell badge-cell--crest">
              <img
                src="/crest.png"
                alt="Fire a CRT burst"
                className="crest-icon"
                role="button"
                tabIndex={0}
                onClick={() => window.dispatchEvent(new CustomEvent('sjsys:crt'))}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.dispatchEvent(new CustomEvent('sjsys:crt')); } }}
              />
            </span>
            <span className="badge-cell badge-cell--rotman">
              <span className="rotman-logo" role="img" aria-label="Rotman Commerce" />
            </span>
            <span className="badge-cell badge-cell--year">Class of '29</span>
          </div>
          <div className="sub-badge">
            <p className="sub-badge__label">Intended program</p>
            <dl className="sub-badge__fields">
              <div><dt>Specialist</dt><dd>Management</dd></div>
              <div><dt>Focus</dt><dd>Finance</dd></div>
              <div><dt>Minors</dt><dd>Statistics, Economics</dd></div>
            </dl>
          </div>
          {phone && (
            <div className="hero-figure hero-figure--inline">
              <Incubator />
            </div>
          )}
          <div className="hero-intro">
            {/* One sentence read as three: the aside, the claim on its own
                leaning stripe, and the welcome. */}
            <p className="bio">
              <span className="bio__aside">
                '<span
                  role="button"
                  tabIndex={0}
                  className="sj-trigger"
                  onClick={triggerSjGlow}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerSjGlow(); } }}
                >SJ</span>' also welcome. {age()}.
              </span>{' '}
              <span className="bio__claim"><span>Interdisciplinary builder.</span></span>{' '}
              <span className="bio__welcome">
                Welcome to my personal corner of the internet.
              </span>
            </p>
            <div className="hero-actions">
              <PillarsMenu />
              <Link to="/blog" className="btn-ghost" title={`Latest: ${postsSorted[0].title}`}>
                [TRANSMISSIONS →]
              </Link>
            </div>
          </div>
          {phone && nowBoard}
        </div>
        <div className="right-column">
          <div className="hero-figure">
            {!phone && <Incubator />}
          </div>
          {!phone && nowBoard}
        </div>

        <div className="hero-lower">
          {/* The three lists as stops on one line, in the nav's line colours. */}
          <ol className="stops">
            <li className="stop" style={{ '--line': '#ffc41e' } as CSSProperties}>
              <h3>Hobbies</h3>
              <p>Writing (poetry, flash fiction, whatever), rating root beers, world history / politics.</p>
            </li>
            <li className="stop" style={{ '--line': '#00a54f' } as CSSProperties}>
              <h3>Pet peeves</h3>
              <p>Lack of turn signals, inconsiderateness, "could of."</p>
            </li>
            <li
              className={`stop fun-facts${elevatorDropping ? ' elevator-dropping' : ''}`}
              style={{ '--line': '#a21a68' } as CSSProperties}
            >
              <h3>Fun facts</h3>
              <p>
                Afraid of{' '}
                <span
                  className="elevator-trigger"
                  role="button"
                  tabIndex={0}
                  onClick={dropElevator}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dropElevator(); } }}
                >
                  elevators
                </span>
                . Japanese mechanical pencils collection. Double jointed in both thumbs.
              </p>
              {elevatorDropping && <span className="falling-elevator" aria-hidden="true">▯</span>}
            </li>
          </ol>

          {/* The skyline that closes the hero. The tower swaps to the Statue of
              Liberty on hover, or on a tap where there is no hover. */}
          <div className="skyline">
            {SKYLINE.map(([w, h], i) =>
              i === TOWER_AT ? (
                <button
                  key="landmark"
                  type="button"
                  className={`skyline__landmark${showSoL ? ' is-swapped' : ''}`}
                  aria-label={showSoL ? 'Statue of Liberty: show the CN Tower' : 'CN Tower: show the Statue of Liberty'}
                  onClick={() => setShowSoL((v) => !v)}
                >
                  <img src="/CNtower.png" alt="" className="landmark-default" />
                  <img src="/SoL.png" alt="" className="landmark-hover" />
                </button>
              ) : (
                <i key={i} className="skyline__block" style={{ flexGrow: w, height: `${h}%` }} aria-hidden="true" />
              ),
            )}
          </div>
        </div>
      </section>


      <section className="section tenets-section">
        <div className="section-header">
          <h2 className="tenets-title"><ScrambleText text="TENETS" /></h2>
          <p className="tenets-subtitle">v0.3, subject to revision without notice</p>
        </div>
        <div className="divider-line"></div>
        <div className="tenets-grid">
          <Reveal delay={0}>
          <div className="tenet-card">
            <div className="tenet-number">01</div>
            <h3>THE FALSE EQUIVALENCE</h3>
            <p>Being content ≠ being happy. Content means nothing hurts. Happy means something's alive. The dangerous part is how similar they feel from the inside.</p>
          </div>
          </Reveal>
          <Reveal delay={0.1}>
          <div className="tenet-card">
            <div className="tenet-number">02</div>
            <h3>THE MUNDANE ENTERTAINED</h3>
            <p>Trying to never be bored is a mistake. A commute, a queue, a slow Tuesday afternoon. Anything gets interesting if you stare at it long enough.</p>
          </div>
          </Reveal>
          <Reveal delay={0.2}>
          <div className="tenet-card">
            <div className="tenet-number">03</div>
            <h3>THE ALTERNATIVE HYPOTHESIS</h3>
            <p>The plan will change. What matters is whether you change with it or stand there mourning past potential. "Life, uh, finds a way."</p>
          </div>
          </Reveal>
        </div>

        <div className="quotes-section">
          <div className="statements-grid">
            <div className="statement-block">
              <h4>[CORE BELIEFS]</h4>
              <ul className="brutalist-list">
                <li>Art is political.</li>
                <li>Business is personal.</li>
                <li>Technology is philosophy.</li>
              </ul>
              <p className="beliefs-footnote">/* three things I'll probably over-defend at a party, but I feel an imperative need to for some reason */</p>
              <div className="beliefs-graphic">
                <a href="https://en.wikipedia.org/wiki/Mysterium_Cosmographicum" target="_blank" rel="noopener noreferrer" className="kepler-link">
                  <img src="/Kepler.png" alt="Kepler's Mysterium Cosmographicum diagram" />
                </a>
              </div>
            </div>

            <div className="quotes-block">
              <h4>[REFERENCE QUOTE]</h4>
              <div className="quote-item large-quote quote-with-image quote-paper">
                <div className="quote-text-content">
                  <p>"It is the mark of an educated mind, to entertain a thought without accepting it."</p>
                  <span>— (Probably not) Aristotle</span>
                </div>
                <div className="quote-image-container">
                  <a href="https://sententiaeantiquae.com/2018/09/22/nope-aristotle-did-not-say-it-is-the-mark-of-an-educated-mind-to-entertain-a-thought-without/" target="_blank" rel="noopener noreferrer">
                    <img src="/Aristotle.jpg" alt="Aristotle" className="aristotle-img" loading="lazy" decoding="async" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="section guestbook-preview-section">
        <div className="section-header">
          <h2><ScrambleText text="GUESTBOOK" /></h2>
          <p className="section-desc">visitors who've left their mark</p>
        </div>

        {/* 3 most recent approved entries, side by side */}
        <div className="guestbook-preview-grid">
          {guestbookLoading &&
            [0, 1, 2].map((i) => <div key={i} className="gb-skeleton" aria-hidden="true" />)}

          {!guestbookLoading && guestbookError && (
            <div className="gb-notice">[ COULDN'T REACH THE LOG — {guestbookError} ]</div>
          )}

          {!guestbookLoading && !guestbookError && previewEntries.length === 0 && (
            <div className="gb-notice">[ NO ENTRIES YET — be the first. ]</div>
          )}

          {!guestbookLoading &&
            !guestbookError &&
            previewEntries.map((entry, index) => (
              <Reveal key={entry.id} delay={index * 0.07}>
                <GuestbookCard entry={entry} compact />
              </Reveal>
            ))}
        </div>

        <div className="guestbook-preview-footer">
          <Link to="/guestbook" className="btn-ghost">[ VIEW ALL + SIGN → ]</Link>
        </div>
      </section>


      <section className="section contact-section" id="connect">
        <div className="section-header">
          <h2><ScrambleText text="CONNECT" /></h2>
        </div>
        <ScratchReveal email="srihith.jarabana@mail.utoronto.ca" />
        <div className="social-links" style={{ justifyContent: 'center' }}>
          <a href="https://www.linkedin.com/in/srihithjarabana/" target="_blank" rel="noopener noreferrer" className="social-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/smlogos/LinkedIn.webp" alt="LinkedIn" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
            [LINKEDIN ↗]
          </a>
          <a href="https://github.com/12g3nd" target="_blank" rel="noopener noreferrer" className="social-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/smlogos/GitHub.webp" alt="GitHub" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
            [GITHUB ↗]
          </a>
          {/* Spotify and Letterboxd live on /media now, as embeds rather than
              links — a playlist you can play beats a pill you can click. */}
          <a href="https://www.instagram.com/sssrihith/" target="_blank" rel="noopener noreferrer" className="social-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/smlogos/Instagram.png" alt="Instagram" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
            [INSTAGRAM ↗]
          </a>
        </div>
      </section>
    </PageTransition>
  );
}
