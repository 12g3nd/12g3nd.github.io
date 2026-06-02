
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import ScrambleText from './ScrambleText';
import MatrixRain from './MatrixRain';
import PartyOverlay from './PartyOverlay';
import { isLateNight } from '../utils/time';
import './Navigation.css';

const PHRASES = [
  "> scanning user... name: srihith jarabana... status: building things",
  "> clout: [citation needed]. aura: self-reported.",
  "> running diagnostics... critical error: caffeine levels low.",
  "> current aesthetic: brutalism x y2k.",
  "> location ping: robarts library, 12th floor. status: on the grind.",
  "> fit check... evaluating... result: trying too hard. recalibrating.",
  "> easter egg check... found one: most images are clickable.",
  "> tip: double-click this bar, then type 'help'.",
];

// Shown first only during the 1–5am visitor-local window (see isLateNight).
const LATE_NIGHT_PHRASE =
  "> caffeine [CRITICAL]... it's past 1am. why are we both awake?";

// The brand cycles through these on a triple-click, then settles back to SJ.SYS.
const BRAND_GLITCH = ['SRIHITH.SYS', 'SJARABANA.OS', 'BUSINESSMAN.EXE', 'SJ.SYS'];
const BRAND_STEP = 650; // ms per glitch frame

const ROUTES: Record<string, string> = {
  projects: '/projects',
  business: '/business',
  'cd business': '/business',
  'business.xlsx': '/business',
  'open business.xlsx': '/business',
  media: '/media',
  poetry: '/poetry',
  blog: '/blog',
  home: '/',
  '~': '/',
  'cd ~': '/',
  cd: '/',
};

export default function Navigation() {
  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // command-line mode
  const [commandMode, setCommandMode] = useState(false);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  // easter-egg state
  const [matrix, setMatrix] = useState(false);
  const [party, setParty] = useState(false);
  const [brand, setBrand] = useState('SJ.SYS');
  const [brandGlitch, setBrandGlitch] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const brandTimers = useRef<number[]>([]);

  // Late-night phrase is prepended only inside the small-hours window.
  const phrases = useMemo(
    () => (isLateNight() ? [LATE_NIGHT_PHRASE, ...PHRASES] : PHRASES),
    []
  );

  const navigate = useNavigate();

  useEffect(() => {
    if (commandMode) return; // pause typewriter while typing commands

    const currentPhrase = phrases[phraseIndex];
    let typingSpeed = isDeleting ? 30 : 60;

    if (!isDeleting && text === currentPhrase) {
      typingSpeed = 3000;
      const timer = setTimeout(() => setIsDeleting(true), typingSpeed);
      return () => clearTimeout(timer);
    } else if (isDeleting && text === '') {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
      return;
    }

    const timeout = setTimeout(() => {
      setText(currentPhrase.substring(0, text.length + (isDeleting ? -1 : 1)));
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIndex, commandMode, phrases]);

  // Triple-click the wordmark: scramble through alternate OS names, then settle.
  const glitchBrand = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    brandTimers.current.forEach((t) => clearTimeout(t));
    brandTimers.current = [];
    setBrandGlitch(true);
    BRAND_GLITCH.forEach((label, i) => {
      brandTimers.current.push(
        window.setTimeout(() => setBrand(label), i * BRAND_STEP)
      );
    });
    brandTimers.current.push(
      window.setTimeout(() => setBrandGlitch(false), BRAND_GLITCH.length * BRAND_STEP + 300)
    );
  };

  useEffect(() => () => brandTimers.current.forEach((t) => clearTimeout(t)), []);

  const fireMatrix = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setMatrix(true);
    window.setTimeout(() => setMatrix(false), 4500);
  };

  const openResume = () => {
    localStorage.setItem('sjsys_resume_unlocked', '1');
    window.open('/resume.pdf', '_blank', 'noopener');
  };

  // Returns the new on/off state so the command can report it.
  const toggleParty = () => {
    const on = !document.body.classList.contains('party-mode');
    document.body.classList.toggle('party-mode', on);
    setParty(on);
    return on;
  };

  const openCommandMode = () => {
    window.getSelection()?.removeAllRanges();
    setOutput('');
    setInput('');
    setCommandMode(true);
    // Both the desktop and mobile rows render an input, but only one is visible
    // at a time. Focus whichever is currently displayed (offsetParent !== null).
    requestAnimationFrame(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('.terminal-input');
      inputs.forEach((el) => {
        if (el.offsetParent !== null) el.focus();
      });
    });
  };

  const closeCommandMode = () => {
    setCommandMode(false);
    setInput('');
    setOutput('');
    setExpanded(false);
  };

  const runCommand = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    setExpanded(false);
    if (!cmd) return;

    if (cmd in ROUTES) {
      navigate(ROUTES[cmd]);
      window.scrollTo(0, 0);
      closeCommandMode();
      return;
    }

    switch (cmd) {
      case 'help':
        setOutput('nav: projects · business · media · poetry · blog · home  |  try: whoami · cat beliefs.txt · uptime · resume · sudo hire-me · ls · clear · exit  |  (some commands are undocumented. poke around.)');
        break;
      case 'whoami':
        setOutput('srihith jarabana — businessman by craft. 19. probably overthinking something.');
        break;
      case 'whoami --real':
      case 'whoami -r':
        setOutput("srihith jarabana — 19, runs on iced coffee and spite. tells people he's 'busy building' (he is, mostly, sometimes). afraid of elevators, unafraid of bad ideas. will argue art is political until you leave the party.");
        break;
      case 'cat beliefs.txt':
      case 'cat beliefs':
        setOutput('art is political. business is personal. technology is philosophy.');
        break;
      case 'uptime':
        setOutput('online since 2006 · 19 yrs · 0 full crashes (a few close calls)');
        break;
      case 'resume':
      case 'cat resume':
      case 'cat resume.pdf':
      case 'open resume':
      case 'download resume':
        openResume();
        setOutput('opening résumé → /resume.pdf');
        break;
      case 'sudo hire-me':
      case 'sudo hire me':
        setOutput('access granted → srihith.jarabana@mail.utoronto.ca');
        break;
      case 'sudo hire-me --serious':
      case 'sudo hire me --serious':
      case 'hire-me --serious':
        setOutput(
          [
            'srihith jarabana // availability report',
            '----------------------------------------',
            'status    : open to summer 2027 internships',
            'seeking   : finance · quant research · IB / PE',
            'strengths : modeling, writing, building (this site, e.g.)',
            'résumé    : type `resume` to open the pdf',
            'reach me  : srihith.jarabana@mail.utoronto.ca',
            '----------------------------------------',
            "the version i'd actually send a recruiter.",
          ].join('\n')
        );
        break;
      case 'cat rootbeer.log':
      case 'cat rootbeer':
      case 'rootbeer':
        setOutput(
          [
            '== ROOTBEER.LOG // field notes, unscientific ==',
            '1. A&W (on tap)        ★★★★★  the benchmark. creamy, correct.',
            '2. Barq\'s              ★★★★☆  the bite. respect the caffeine.',
            '3. Mug                 ★★★★☆  reliable. fridge staple.',
            '4. IBC (glass bottle)  ★★★☆☆  style points, runs sweet.',
            '5. Crush               ★★★☆☆  fine. forgettable.',
            '— ratings revised without notice. fight me.',
          ].join('\n')
        );
        break;
      case 'theme light':
        document.documentElement.classList.add('theme-light');
        localStorage.setItem('sjsys_theme', 'light');
        setOutput('theme → light. cyan-on-navy is sacred; this is heresy. enjoy.');
        break;
      case 'theme dark':
        document.documentElement.classList.remove('theme-light');
        localStorage.setItem('sjsys_theme', 'dark');
        setOutput('theme → dark. order restored.');
        break;
      case 'theme':
        setOutput('usage: theme dark | theme light');
        break;
      case 'matrix':
        fireMatrix();
        setOutput('follow the white rabbit…');
        break;
      case 'party mode':
      case 'party':
      case 'partymode':
      case 'party-mode':
        setOutput(
          toggleParty()
            ? '🦄 PARTY MODE ENGAGED 🌈 — type `party mode` again to return to your regularly scheduled professionalism.'
            : 'party mode disengaged. back to business. 💼'
        );
        break;
      case '42':
        setOutput('42 — the answer to life, the universe, and everything. still debugging the question.');
        break;
      case 'cat .secret':
      case 'cat secret':
        setOutput(
          [
            "> you found it. there's no prize, only the principle of the thing.",
            '> ok fine, one tip: the konami code does something. ↑ ↑ ↓ ↓ ← → ← → b a',
          ].join('\n')
        );
        break;
      case 'sudo rm -rf /':
      case 'sudo rm -rf /*':
      case 'rm -rf /':
      case 'rm -rf /*':
        setOutput('nice try. SJ.SYS is read-only to visitors. (and to me, on a good day.)');
        break;
      case 'ls':
        setOutput('projects/   media/   poetry/   blog/   business.xlsx   beliefs.txt   rootbeer.log   resume.pdf   .secret');
        break;
      case 'clear':
        setOutput('');
        break;
      case 'exit':
      case 'q':
        closeCommandMode();
        return;
      default:
        setOutput(`command not found: ${cmd} — type 'help'`);
    }
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(input);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeCommandMode();
    }
  };

  const multiline = output.includes('\n');

  const terminalBody = commandMode ? (
    <div className={`terminal-cmd${multiline || expanded ? ' terminal-cmd--multiline' : ''}`}>
      <span className="terminal-prompt">srihith@sj.sys</span>
      <span className="terminal-prompt-sep">:~$</span>
      <input
        className="terminal-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={closeCommandMode}
        spellCheck={false}
        autoComplete="off"
        aria-label="Terminal command input"
      />
      {output && (
        <span className={`terminal-output${multiline || expanded ? ' terminal-output--block' : ''}`}>
          {output}
        </span>
      )}
      {output && !multiline && (
        <button
          type="button"
          className="terminal-expand-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? 'Collapse output' : 'Expand output'}
        >
          ▸ {expanded ? 'Collapse' : 'Expand'}
        </button>
      )}
    </div>
  ) : (
    <>
      <span className="terminal-idle">
        <span className="terminal-text">{text}</span>
        <span className="terminal-cursor">_</span>
      </span>
      <span className="terminal-hint" aria-hidden="true">▸ dbl-click</span>
    </>
  );

  return (
    <>
      {matrix && <MatrixRain />}
      {party && <PartyOverlay />}
      <nav className="brutalist-nav">
        <NavLink
          to="/"
          className="nav-brand"
          onClick={(e) => {
            // Triple-click glitches the wordmark instead of navigating.
            if (e.detail === 3) {
              e.preventDefault();
              glitchBrand();
            }
          }}
        >
          {brandGlitch ? <ScrambleText text={brand} /> : 'SJ.SYS'}
        </NavLink>

        <div
          className={`terminal-header-box${commandMode ? ' terminal-header-box--active' : ''}${multiline || expanded ? ' terminal-header-box--multiline' : ''}`}
          onDoubleClick={openCommandMode}
          title="Double-click to enter a command"
        >
          {terminalBody}
        </div>

        <div className="nav-links">
          <NavLink to="/projects">PROJECTS</NavLink>
          <NavLink to="/media">MEDIA</NavLink>
          <NavLink to="/poetry">POETRY</NavLink>
          <NavLink to="/blog">BLOG</NavLink>
        </div>
      </nav>

      <div
        className={`terminal-mobile-row${commandMode ? ' terminal-header-box--active' : ''}${multiline ? ' terminal-header-box--multiline' : ''}`}
        onClick={() => { if (!commandMode) openCommandMode(); }}
      >
        {terminalBody}
      </div>
    </>
  );
}
