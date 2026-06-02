import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import ScrambleText from '../components/ScrambleText';
import AsciiRipple from '../components/AsciiRipple';
import PartyOverlay from '../components/PartyOverlay';
import WhimsyOverlay from '../components/WhimsyOverlay';
import GuestbookCard from '../components/GuestbookCard';
import useDocumentMeta from '../hooks/useDocumentMeta';
import useGuestbook from '../hooks/useGuestbook';
import './Home.css';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Home() {
  const [showSoL, setShowSoL] = useState(false);
  const [emailRevealed, setEmailRevealed] = useState(false);

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

  // Hidden résumé chip: unlocks once a visitor pokes past the email reveal
  // (here) or runs `resume` in the terminal (sets the same flag).
  const [resumeUnlocked, setResumeUnlocked] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem('sjsys_resume_unlocked') === '1'
  );
  const emailPokes = useRef(0);
  const unlockResume = () => {
    localStorage.setItem('sjsys_resume_unlocked', '1');
    setResumeUnlocked(true);
  };

  // Guestbook preview — 3 most-recent approved entries. useGuestbook caches in
  // module memory, so the full /guestbook page reuses this fetch (no second hit).
  const { entries: guestbookEntries, loading: guestbookLoading } = useGuestbook();
  const previewEntries = guestbookEntries.slice(0, 3);

  useDocumentMeta(
    'Srihith Jarabana',
    "Srihith Jarabana's personal corner of the internet — projects, writing, poetry, and the things that make up a worldview."
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
                onClick={triggerWhimsy}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerWhimsy(); } }}
              />
            </h1>
            <h1 className="outline-text">
              <span className={sjGlow ? 'letter-glow' : ''}>J</span>ARABANA
            </h1>
            <img src="/figure.png" alt="Wireframe Figure" className="mobile-figure-inline wireframe-glitch" />
            <p className="phonetic-text">/sriːhɪθ dʒʊəˌræˈbɑːnə/</p>
          </div>
          <div className="badge-row">
            <div className="badge">Rotman Commerce // Class of '29</div>
            <img
                src="/crest.png"
                alt="University Crest"
                className="crest-icon"
                role="button"
                tabIndex={0}
                onClick={() => window.dispatchEvent(new CustomEvent('sjsys:crt'))}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.dispatchEvent(new CustomEvent('sjsys:crt')); } }}
              />
          </div>
          <p className="sub-badge">Intended: Management Specialist, Focus in Finance, Minor in Statistics and Economics</p>
          <div className="description-card">
            <p>
              '<span
                role="button"
                tabIndex={0}
                className="sj-trigger"
                onClick={triggerSjGlow}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerSjGlow(); } }}
              >SJ</span>' also welcome. 19. Businessman by craft. Also, strong STEM and literature background.
              Welcome to my personal (and humble) corner of the internet.
            </p>
            <div className="hero-actions">
              <Link to="/projects" className="btn-primary">[VIEW PROJECTS →]</Link>
              <Link to="/blog" className="btn-ghost">[READ BLOG →]</Link>
            </div>
          </div>
          <div className="expanded-details">
            <div className="detail-col">
              <span className="accent-slash">//</span><strong>HOBBIES</strong>
              <p>Writing (poetry, flash fiction, whatever), rating root beers, world history / politics.</p>
            </div>
            <div className="detail-col">
              <span className="accent-slash">//</span><strong>PET PEEVES</strong>
              <p>Lack of turn signals, inconsiderateness, "could of."</p>
            </div>
            <div className={`detail-col fun-facts${elevatorDropping ? ' elevator-dropping' : ''}`}>
              <span className="accent-slash">//</span><strong>FUN FACTS</strong>
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
            </div>
          </div>

          {/* Mobile-only: What I'm Up To + Landmark */}
          <div className="mobile-what-im-up-to">
            <div className="what-im-up-to-card">
              <h3><span className="accent-slash">//</span> WHAT I'M UP TO</h3>
              <p>Learning & building financial models. Career aspirations include quant researcher and similar roles in pe/ib. Looking into research and want to delve into the academic side of business as well.</p>
            </div>
            <div className="mobile-landmark-swap" onClick={() => setShowSoL(prev => !prev)}>
              <img
                src={showSoL ? '/SoL.png' : '/CNtower.png'}
                alt={showSoL ? 'Statue of Liberty' : 'CN Tower'}
              />
            </div>
          </div>
        </div>
        <div className="right-column">
          <div className="hero-figure">
            <img src="/figure.png" alt="Wireframe Figure" className="wireframe-glitch" />
          </div>
          <div className="what-im-up-to-card">
            <h3><span className="accent-slash">//</span> WHAT I'M UP TO</h3>
            <p>Learning & building financial models. Looking into research and want to delve into the academic side of business as well.</p>
          </div>
          {/* Decorative landmark. The outer box spans the whole gutter between the
              hero card and the "what I'm up to" card; the inner __fig is centered
              inside it, so the tower sits dead-centre between the two boxes at any
              width. Swaps CN Tower ↔ Statue of Liberty on hover. */}
          <div className="landmark-swap">
            <div className="landmark-swap__fig">
              <img src="/CNtower.png" alt="CN Tower" className="cn-tower-decor landmark-default" />
              <img src="/SoL.png" alt="Statue of Liberty" className="cn-tower-decor landmark-hover" />
            </div>
          </div>
        </div>
      </section>


      <section className="section tenets-section">
        <div className="section-header">
          <h2 className="tenets-title"><ScrambleText text="TENETS_" /></h2>
          <p className="tenets-subtitle">// [ pretentious sounding ] beliefs, v0.3 (subject to revision without notice)</p>
        </div>
        <div className="divider-line"></div>
        <div className="tenets-grid">
          <Reveal delay={0}>
          <div className="tenet-card">
            <div className="tenet-number">01</div>
            <h3><span className="accent-slash">//</span> NATURE OF SELF</h3>
            <p>Being content ≠ being happy. Stark difference between chasing passion instead of paper.</p>
          </div>
          </Reveal>
          <Reveal delay={0.1}>
          <div className="tenet-card">
            <div className="tenet-number">02</div>
            <h3><span className="accent-slash">//</span> THE MUNDANE ENTERTAINED</h3>
            <p>Trying to never be bored is the biggest mistake of all time. The small things do matter, but so does the big picture.</p>
          </div>
          </Reveal>
          <Reveal delay={0.2}>
          <div className="tenet-card">
            <div className="tenet-number">03</div>
            <h3><span className="accent-slash">//</span> THE ALTERNATIVE HYPOTHESIS</h3>
            <p>The plan will change. What matters is whether you change with it or stand there mourning past potential. "Life, uh, finds a way" or something like that.</p>
          </div>
          </Reveal>
        </div>

        <div className="quotes-section">
          <div className="statements-grid">
            <div className="statement-block">
              <h4>[CORE_BELIEFS]</h4>
              <ul className="brutalist-list">
                <li><span className="accent-slash">//</span> Art is political.</li>
                <li><span className="accent-slash">//</span> Business is personal.</li>
                <li><span className="accent-slash">//</span> Technology is philosophy.</li>
              </ul>
              <p className="beliefs-footnote">/* three things I'll probably over-defend at a party, but I feel an imperative need to for some reason */</p>
              <div className="beliefs-graphic">
                <a href="https://en.wikipedia.org/wiki/Mysterium_Cosmographicum" target="_blank" rel="noopener noreferrer" className="kepler-link">
                  <img src="/Kepler.png" alt="Kepler's Mysterium Cosmographicum diagram" />
                </a>
              </div>
            </div>

            <div className="quotes-block">
              <h4>[REFERENCE_QUOTE]</h4>
              <div className="quote-item large-quote quote-with-image quote-paper">
                <div className="quote-text-content">
                  <p>"It is the mark of an educated mind, to entertain a thought without accepting it."</p>
                  <span>— (Probably not) Aristotle</span>
                </div>
                <div className="quote-image-container">
                  <a href="https://sententiaeantiquae.com/2018/09/22/nope-aristotle-did-not-say-it-is-the-mark-of-an-educated-mind-to-entertain-a-thought-without/" target="_blank" rel="noopener noreferrer">
                    <img src="/Aristotle.jpg" alt="Aristotle" className="aristotle-img" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="section guestbook-preview-section">
        <div className="section-header">
          <h2><ScrambleText text="GUESTBOOK_" /></h2>
          <p className="section-desc">visitors who've left their mark</p>
        </div>

        {/* 3 most recent approved entries, side by side */}
        <div className="guestbook-preview-grid">
          {guestbookLoading &&
            [0, 1, 2].map((i) => <div key={i} className="gb-skeleton" aria-hidden="true" />)}

          {!guestbookLoading && previewEntries.length === 0 && (
            <div className="gb-notice">[ NO ENTRIES YET — be the first. ]</div>
          )}

          {!guestbookLoading &&
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


      <section className="section contact-section">
        <div className="section-header">
          <h2>CONNECT_</h2>
        </div>
        {emailRevealed ? (
          <a
            href="mailto:srihith.jarabana@mail.utoronto.ca"
            className="email-box"
            onClick={(e) => {
              // Keep poking and the hidden résumé chip unlocks (3rd poke).
              emailPokes.current += 1;
              if (emailPokes.current >= 3 && !resumeUnlocked) {
                e.preventDefault();
                unlockResume();
              }
            }}
          >
            <span className="email-text">srihith.jarabana@mail.utoronto.ca</span>
          </a>
        ) : (
          <button
            type="button"
            className="email-box email-box-hidden"
            onClick={() => setEmailRevealed(true)}
            aria-label="Click to reveal email address"
          >
            <span className="email-text">[ CLICK TO REVEAL ]</span>
          </button>
        )}
        {resumeUnlocked && (
          <a
            href="/resume.pdf"
            download="Srihith Jarabana - Resume.pdf"
            className="resume-chip"
          >
            [ DOWNLOAD RÉSUMÉ ↓ ]
          </a>
        )}
        <div className="social-links" style={{ justifyContent: 'center' }}>
          <a href="https://www.linkedin.com/in/srihithjarabana/" target="_blank" rel="noopener noreferrer" className="social-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/smlogos/LinkedIn.webp" alt="LinkedIn" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
            [LINKEDIN ↗]
          </a>
          <a href="https://github.com/12g3nd" target="_blank" rel="noopener noreferrer" className="social-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/smlogos/GitHub.webp" alt="GitHub" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
            [GITHUB ↗]
          </a>
          <a href="https://letterboxd.com/Solder/" target="_blank" rel="noopener noreferrer" className="social-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/smlogos/Letterboxd.jpg" alt="Letterboxd" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
            [LETTERBOXD ↗]
          </a>
          <a href="https://open.spotify.com/user/htofsfnpjzmpszwp8r6hz5osz" target="_blank" rel="noopener noreferrer" className="social-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/smlogos/Spotify.png" alt="Spotify" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
            [SPOTIFY ↗]
          </a>
          <a href="https://www.instagram.com/sssrihith/" target="_blank" rel="noopener noreferrer" className="social-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/smlogos/Instagram.png" alt="Instagram" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
            [INSTAGRAM ↗]
          </a>
        </div>
      </section>
    </PageTransition>
  );
}
