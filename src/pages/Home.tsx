import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
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
import MonitorArm from '../components/MonitorArm';
import BeliefMagnets from '../components/BeliefMagnets';
import PillarsMenu from '../components/PillarsMenu';
import TenetCards from '../components/TenetCards';
import QuoteCube from '../components/QuoteCube';
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

// Friends with websites. `about` is how each site describes itself; `photo`
// is a dithered portrait in their tile colour, made by
// scripts/dither-blogroll.mjs.
const BLOGROLL = [
  {
    name: 'Skyler Xiao',
    photo: '/blogroll/skyler-xiao.png',
    about: 'Electrical Engineering @ McGill',
    href: 'https://skylerxiao.ca/',
    domain: 'skylerxiao.ca',
    tile: '#a8713f',
    onTile: '#0a1320',
  },
  {
    name: 'Aryan Thakur',
    photo: '/blogroll/aryan-thakur.png',
    about: 'The Universe of Aryan Thakur',
    href: 'https://www.aryanthakur.ca/',
    domain: 'aryanthakur.ca',
    tile: '#a21a68',
    onTile: '#fdf6e3',
  },
] as const;

/** 7pm to 6am, by the visitor's own clock. */
const isNight = () => {
  const h = new Date().getHours();
  return h >= 19 || h < 6;
};

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
  // visitors get a calmer, shorter version (no spin/confetti/strobe). It takes
  // over the whole screen, so it can always be stopped early: Escape, or the
  // star again (it is a toggle).
  const [partyActive, setPartyActive] = useState(false);
  const [splashActive, setSplashActive] = useState(false);
  const [calmMode, setCalmMode] = useState(false);
  const [smileyActive, setSmileyActive] = useState(false);
  const whimsyTimers = useRef<number[]>([]);

  const endWhimsy = useCallback(() => {
    whimsyTimers.current.forEach((t) => window.clearTimeout(t));
    whimsyTimers.current = [];
    setSplashActive(false);
    setSmileyActive(false);
    setPartyActive(false);
    document.body.classList.remove('party-mode');
  }, []);

  const whimsyOn = partyActive || splashActive;

  useEffect(() => {
    if (!whimsyOn) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') endWhimsy(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [whimsyOn, endWhimsy]);

  const triggerWhimsy = () => {
    if (whimsyOn) {
      endWhimsy();
      return;
    }
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
  const { entries: guestbookEntries, loading: guestbookLoading, error: guestbookError, retry: retryGuestbook } = useGuestbook();
  const previewEntries = guestbookEntries.slice(0, 3);

  useDocumentMeta(routeMeta.home.title, routeMeta.home.description);

  // One incubator, mounted in whichever spot the layout shows: the right
  // column on desktop, inline under the program on phones. Two would mean two
  // WebGL contexts, one of them drawing into a hidden column.
  const phone = useMediaQuery('(max-width: 768px)');

  // After dark (local time) the skyline's windows come on. Checked again every
  // few minutes, so a page left open across dusk catches up.
  const [night, setNight] = useState(isNight);
  useEffect(() => {
    const t = window.setInterval(() => setNight(isNight()), 5 * 60 * 1000);
    return () => window.clearInterval(t);
  }, []);

  // "What I'm up to", as a departures board (edit NOW_BOARD above) on a
  // monitor. On desktop the monitor hangs from an arm off the page's right
  // edge, under the incubator; on phones it sits after the intro, no arm.
  const nowBoard = (
    <div className="monitor">
      {!phone && <MonitorArm />}
      <div className="monitor__bezel">
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
        <div className="monitor__chin" aria-hidden="true">
          <span className="monitor__brand">SJ VISION</span>
          <span className="monitor__led" />
        </div>
      </div>
    </div>
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
            {/* One h1 for the name, two lines inside it, so the page has a
                single top-level heading rather than one per word. */}
            <h1 className="hero-name">
            <span className="title-srihith">
              <span className={sjGlow ? 'letter-glow' : ''}>S</span>RIHITH
              <img
                src="/y2k1.png"
                alt={whimsyOn ? 'Stop whimsy mode' : 'Activate whimsy mode'}
                aria-pressed={whimsyOn}
                className={`y2k-accent${partyActive && !calmMode ? ' y2k-spinning' : ''}`}
                role="button"
                tabIndex={0}
                draggable={false}
                onClick={triggerWhimsy}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerWhimsy(); } }}
              />
            </span>
            <span className="outline-text">
              <span className={sjGlow ? 'letter-glow' : ''}>J</span>ARABANA
            </span>
            </h1>
            <p className="phonetic-text">/sriːhɪθ dʒʊəˌræˈbɑːnə/</p>
          </div>
          {/* One segmented strip: the crest (still the CRT-burst egg) as its
              first cell, so it is always centred against the text, then the
              program and the year. */}
          <div className="badge-row">
            <span className="badge-cell badge-cell--crest">
              <span
                className="crest-icon"
                role="button"
                aria-label="Fire a CRT burst"
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
                Welcome to my <s className="bio__struck">world</s> personal corner of the internet.
              </span>
            </p>
            <div className="hero-actions">
              <PillarsMenu />
              <Link to="/blog" className="btn-ghost" title={`Latest: ${postsSorted[0].title}`}>
                TRANSMISSIONS →
              </Link>
            </div>
          </div>
          {/* On a phone the surfer comes after the bio and the buttons, so the
              first screen says who this is and where to go, not just a figure. */}
          {phone && (
            <div className="hero-figure hero-figure--inline">
              <Incubator />
            </div>
          )}
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
            <li className="stop" style={{ '--line': 'var(--line-business)' } as CSSProperties}>
              <h3>Hobbies</h3>
              <p>Writing (poetry, flash fiction, whatever), rating root beers, world history / politics.</p>
              <figure className="stop__plate" aria-hidden="true">
                <span className="stop__art" style={{ '--art': 'url(/stop-hobbies.svg)' } as CSSProperties} />
                <figcaption><span>Fig. I</span>pen, root beer, globe</figcaption>
              </figure>
            </li>
            <li className="stop" style={{ '--line': 'var(--line-projects)' } as CSSProperties}>
              <h3>Pet peeves</h3>
              <p>Lack of turn signals, inconsiderateness, "could of."</p>
              <figure className="stop__plate" aria-hidden="true">
                <span className="stop__art" style={{ '--art': 'url(/stop-peeves.svg)' } as CSSProperties} />
                <figcaption><span>Fig. II</span>no signal; could have</figcaption>
              </figure>
            </li>
            <li
              className={`stop fun-facts${elevatorDropping ? ' elevator-dropping' : ''}`}
              style={{ '--line': 'var(--line-poetry)' } as CSSProperties}
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
              <figure className="stop__plate" aria-hidden="true">
                <span className="stop__art" style={{ '--art': 'url(/stop-funfacts.svg)' } as CSSProperties} />
                <figcaption><span>Fig. III</span>going down; the collection</figcaption>
              </figure>
              {elevatorDropping && <span className="falling-elevator" aria-hidden="true">▯</span>}
            </li>
          </ol>

          {/* The skyline that closes the hero. The tower swaps to the Statue of
              Liberty on hover, or on a tap where there is no hover. */}
          <div className={`skyline${night ? ' skyline--night' : ''}`}>
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
                <i
                  key={i}
                  className="skyline__block"
                  // Each block's lit windows start at their own offset, so the
                  // city at night is not one repeating pattern.
                  style={{ flexGrow: w, height: `${h}%`, '--wx': `${(i * 7) % 21}px`, '--wy': `${(i * 11) % 27}px` } as CSSProperties}
                  aria-hidden="true"
                />
              ),
            )}
          </div>
        </div>
      </section>


      <section className="section tenets-section">
        <div className="section-header">
          <h2 className="tenets-title"><ScrambleText text="TENETS & TRADING CARDS" /></h2>
        </div>
        <div className="divider-line"></div>
        <TenetCards />

        <div className="quotes-section">
          <div className="statements-grid">
            <div className="statement-block">
              <h3 className="tape">CORE BELIEFS</h3>
              <BeliefMagnets />
              {/* An original engraving after Kepler's Mysterium Cosmographicum,
                  drawn in Affinity: one machine, three bowls, a solid nested in
                  each, named for the three beliefs. It links to the plate it
                  borrows from. */}
              <div className="beliefs-graphic">
                <a href="https://en.wikipedia.org/wiki/Mysterium_Cosmographicum" target="_blank" rel="noopener noreferrer" className="kepler-link">
                  <img
                    src="/beliefs-machine.svg"
                    width="1200"
                    height="520"
                    alt="An engraving in the style of Kepler: three bowls on a long beam, each holding a nested solid, labelled Ars, Negotium and Technē"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
              </div>
            </div>

            <div className="quotes-block">
              <h3 className="tape">REFERENCE QUOTE CUBE</h3>
              <QuoteCube />
            </div>
          </div>
        </div>
      </section>


      <section className="section section--desk guestbook-preview-section">
        <div className="gb-roll">
          <div className="gb-roll__half">
            <div className="section-header">
              <h2><ScrambleText text="Guestbook" accentFrom={5} /></h2>
              <p className="section-desc">visitors who've left their mark</p>
            </div>

            {/* The 3 most recent approved entries, stacked and overlapping a
                little so they fit half the width without shrinking. */}
            <div className="guestbook-preview-grid">
              {guestbookLoading &&
                [0, 1, 2].map((i) => <div key={i} className="gb-skeleton" aria-hidden="true" />)}

              {!guestbookLoading && guestbookError && (
                // The browser's own message ("Failed to fetch") means nothing
                // to a visitor; it stays in the tooltip for whoever is debugging.
                <div className="gb-notice" role="status" title={guestbookError}>
                  [ THE LOG IS OFFLINE FOR A MOMENT.{' '}
                  <button type="button" className="gb-retry" onClick={retryGuestbook}>TRY AGAIN</button> ]
                </div>
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
              <Link to="/guestbook" className="btn-ghost">VIEW ALL + SIGN →</Link>
            </div>
          </div>

          <div className="gb-roll__rule" aria-hidden="true" />

          <div className="gb-roll__half">
            <div className="section-header">
              <h2><ScrambleText text="Blogroll" accentFrom={4} /></h2>
              <p className="section-desc">friends with websites</p>
            </div>
            {/* Each line is the site's own description of itself. */}
            <ul className="blogroll">
              {BLOGROLL.map((site) => (
                <li key={site.href} style={{ '--tile': site.tile, '--on-tile': site.onTile } as CSSProperties}>
                  <a href={site.href} target="_blank" rel="noopener noreferrer">
                    <img className="blogroll__photo" src={site.photo} width="64" height="64" alt="" loading="lazy" decoding="async" />
                    <span className="blogroll__text">
                      <span className="blogroll__name">{site.name}</span>
                      <span className="blogroll__about">{site.about}</span>
                    </span>
                    <span className="blogroll__domain">{site.domain} <span aria-hidden="true">↗</span></span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="blogroll__note">More to come...</p>
          </div>
        </div>
      </section>


      <section className="section contact-section" id="connect">
        {/* A TSJ ticket: the email is the scratch-off destination, the socials
            are transfers on the tear-off stub. The paper is the same stock as
            the quote cube, in both themes. */}
        <div className="ticket">
          <div className="ticket__main">
            <header className="ticket__head">
              <h2><ScrambleText text="Connect" /></h2>
              <p><span>ADMIT ONE</span><span>TORONTO TERMINUS</span></p>
            </header>
            <dl className="ticket__fields">
              <div>
                <dt>Passenger</dt>
                <dd className="ticket__passenger">You</dd>
              </div>
              <div>
                <dt>Destination</dt>
                <dd><ScratchReveal email="srihith.jarabana@mail.utoronto.ca" /></dd>
              </div>
            </dl>
            <p className="ticket__fine">Valid for one email, any time. Don't stress about having to transfer.</p>
          </div>
          <div className="ticket__stub">
            <p className="ticket__stub-title">Transfer to</p>
            {/* Spotify and Letterboxd live on /media now, as embeds rather than
                links: a playlist you can play beats a pill you can click. */}
            <ul>
              <li style={{ '--line': '#0a66c2' } as CSSProperties}>
                <a href="https://www.linkedin.com/in/srihithjarabana/" target="_blank" rel="noopener noreferrer">
                  <img src="/smlogos/LinkedIn.webp" alt="" />LinkedIn<span aria-hidden="true">↗</span>
                </a>
              </li>
              <li style={{ '--line': '#2a2418' } as CSSProperties}>
                <a href="https://github.com/12g3nd" target="_blank" rel="noopener noreferrer">
                  <img src="/smlogos/GitHub.webp" alt="" className="ticket__ink-logo" />GitHub<span aria-hidden="true">↗</span>
                </a>
              </li>
              <li style={{ '--line': '#e0216f' } as CSSProperties}>
                <a href="https://www.instagram.com/sssrihith/" target="_blank" rel="noopener noreferrer">
                  <img src="/smlogos/Instagram.png" alt="" />Instagram<span aria-hidden="true">↗</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
