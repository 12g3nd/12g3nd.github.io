
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
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
  guestbook: '/guestbook',
  'cat guestbook.log': '/guestbook',
  'open guestbook.log': '/guestbook',
  blog: '/blog',
  home: '/',
  '~': '/',
  'cd ~': '/',
  cd: '/',
};

// Clickable `ls` output: each entry runs its command on click (navigate, or
// print like `cat`), so the directory listing behaves like a real shell.
const LS_ENTRIES: { label: string; cmd: string }[] = [
  { label: 'projects/', cmd: 'projects' },
  { label: 'media/', cmd: 'media' },
  { label: 'poetry/', cmd: 'poetry' },
  { label: 'blog/', cmd: 'blog' },
  { label: 'business.xlsx', cmd: 'business' },
  { label: 'beliefs.txt', cmd: 'cat beliefs.txt' },
  { label: 'rootbeer.log', cmd: 'cat rootbeer.log' },
  { label: 'resume.pdf', cmd: 'resume' },
  { label: 'guestbook.log', cmd: 'guestbook' },
  { label: '.secret', cmd: 'cat .secret' },
];

// Commands offered by tab-autocomplete. Deliberately omits the deepest easter
// eggs (cat .secret, 42, whoami --real, …) so poking around still rewards.
const COMPLETIONS: string[] = [
  'projects', 'business', 'media', 'poetry', 'blog', 'guestbook', 'home',
  'help', 'whoami', 'uptime', 'resume', 'ls', 'clear', 'exit',
  'cat beliefs.txt', 'cat rootbeer.log', 'cat guestbook.log',
  'sudo hire-me', 'theme dark', 'theme light', 'matrix', 'party mode',
];

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
  // Clickable ls renders React nodes instead of a plain string; null = text output.
  const [outputNode, setOutputNode] = useState<ReactNode>(null);
  const brandTimers = useRef<number[]>([]);

  // Long-press is the touch equivalent of the desktop triple-click: phones can't
  // produce e.detail === 3, so the wordmark glitch would otherwise be unreachable.
  const longPressTimer = useRef(0);
  const longPressFired = useRef(false);
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);

  // Real-shell command history (↑/↓). Kept in a ref — survives closing and
  // reopening the prompt within the session, and doesn't trigger re-renders.
  const historyRef = useRef<string[]>([]);
  const histPos = useRef(0);

  // First-visit affordance. The command line is the heart of the site, but most
  // people read the bar as decoration and never find it. For new visitors we let
  // it breathe in cyan until they engage (or ~12s pass), then never again.
  // Returning visitors and reduced-motion users get no pulse (CSS handles both).
  const [nudge, setNudge] = useState(() => {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem('sjsys_terminal_seen') !== '1';
  });
  const dismissNudge = () => {
    setNudge(false);
    try { localStorage.setItem('sjsys_terminal_seen', '1'); } catch { /* storage may be blocked */ }
  };
  // Auto-settle so the pulse can never become a permanent distraction.
  useEffect(() => {
    if (!nudge) return;
    const t = window.setTimeout(() => {
      setNudge(false);
      try { localStorage.setItem('sjsys_terminal_seen', '1'); } catch { /* storage may be blocked */ }
    }, 12000);
    return () => window.clearTimeout(t);
  }, [nudge]);

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

  // ── Long-press the wordmark (touch) → same glitch as the desktop triple-click.
  const LONG_PRESS_MS = 450;
  const startBrandPress = (e: ReactPointerEvent<HTMLAnchorElement>) => {
    pressOrigin.current = { x: e.clientX, y: e.clientY };
    longPressFired.current = false;
    window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      glitchBrand();
    }, LONG_PRESS_MS);
  };
  const cancelBrandPress = () => window.clearTimeout(longPressTimer.current);
  // Any real movement means a scroll/drag started here, not a press — bail.
  const moveBrandPress = (e: ReactPointerEvent<HTMLAnchorElement>) => {
    const o = pressOrigin.current;
    if (o && Math.hypot(e.clientX - o.x, e.clientY - o.y) > 10) cancelBrandPress();
  };

  useEffect(
    () => () => {
      brandTimers.current.forEach((t) => clearTimeout(t));
      window.clearTimeout(longPressTimer.current);
    },
    []
  );

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
    dismissNudge(); // they found the door — stop nudging, for good
    window.getSelection()?.removeAllRanges();
    setOutput('');
    setOutputNode(null);
    setInput('');
    histPos.current = historyRef.current.length;
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
    setOutputNode(null);
    setExpanded(false);
  };

  const runCommand = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    setExpanded(false);
    setOutputNode(null);
    if (!cmd) return;

    // Record history (skip consecutive dupes), reset the cursor to the live line.
    if (historyRef.current[historyRef.current.length - 1] !== cmd) {
      historyRef.current.push(cmd);
    }
    histPos.current = historyRef.current.length;

    if (cmd in ROUTES) {
      navigate(ROUTES[cmd]);
      window.scrollTo(0, 0);
      closeCommandMode();
      return;
    }

    switch (cmd) {
      case 'help':
        setOutput('nav: projects · business · media · poetry · blog · home  |  try: whoami · cat beliefs.txt · uptime · resume · sudo hire-me · ls · clear · exit  |  ↑/↓ = history · tab = autocomplete  |  (some commands are undocumented. poke around.)');
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
        setOutput('online since 2007 · 19 yrs · 0 full crashes (a few close calls maybe)');
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
        setOutputNode(
          <span className="terminal-ls">
            {LS_ENTRIES.map((entry) => (
              <button
                key={entry.label}
                type="button"
                className="terminal-ls-item"
                onMouseDown={(e) => e.preventDefault()} // keep the input focused
                onClick={() => runCommand(entry.cmd)}
              >
                {entry.label}
              </button>
            ))}
          </span>
        );
        setOutput('');
        break;
      case 'clear':
        setOutput('');
        break;
      case 'exit':
      case 'q':
        closeCommandMode();
        return;
      case '404':
        navigate('/404');
        window.scrollTo(0, 0);
        closeCommandMode();
        return;
      default:
        setOutput(`command not found: ${cmd} — type 'help'`);
    }
    setInput('');
  };

  // ↑/↓ walk the history; past the newest entry returns to the live (empty) line.
  const recallHistory = (dir: number) => {
    const hist = historyRef.current;
    if (hist.length === 0) return;
    const pos = Math.max(0, Math.min(hist.length, histPos.current + dir));
    histPos.current = pos;
    setInput(pos < hist.length ? hist[pos] : '');
  };

  // Tab-complete against known commands. One match completes it; several complete
  // the shared prefix and list the options, like a real shell.
  const autocomplete = () => {
    const cur = input.trim().toLowerCase();
    if (!cur) return;
    const matches = COMPLETIONS.filter((c) => c.startsWith(cur));
    if (matches.length === 0) return;
    setOutputNode(null);
    if (matches.length === 1) {
      setInput(matches[0]);
      setOutput('');
      return;
    }
    let prefix = matches[0];
    for (const m of matches) {
      while (!m.startsWith(prefix)) prefix = prefix.slice(0, -1);
    }
    if (prefix.length > cur.length) setInput(prefix);
    setOutput(matches.join('   '));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(input);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeCommandMode();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      recallHistory(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      recallHistory(1);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      autocomplete();
    }
  };

  const multiline = output.includes('\n');
  // ls renders a clickable block — treat it like multiline output for layout.
  const block = multiline || expanded || outputNode != null;

  const terminalBody = commandMode ? (
    <div className={`terminal-cmd${block ? ' terminal-cmd--multiline' : ''}`}>
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
      {/* Clickable `ls` listing — React nodes, not a string, so each entry
          navigates or runs its command on click. Always block, no expand. */}
      {outputNode && (
        <span className="terminal-output terminal-output--block">{outputNode}</span>
      )}
      {/* Collapsed: output first, then expand button */}
      {!outputNode && output && !expanded && !multiline && (
        <>
          <span className="terminal-output">{output}</span>
          <button
            type="button"
            className="terminal-expand-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setExpanded(true)}
            aria-label="Expand output"
          >
            ▸ Expand
          </button>
        </>
      )}
      {/* Expanded: collapse button first (stays on row 1 with prompt+input), then output block */}
      {!outputNode && output && expanded && !multiline && (
        <>
          <button
            type="button"
            className="terminal-expand-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setExpanded(false)}
            aria-label="Collapse output"
          >
            ▸ Collapse
          </button>
          <span className="terminal-output terminal-output--block">{output}</span>
        </>
      )}
      {/* Multiline output: always block, no expand button */}
      {!outputNode && output && multiline && (
        <span className="terminal-output terminal-output--block">{output}</span>
      )}
    </div>
  ) : (
    <>
      <span className="terminal-idle">
        <span className="terminal-text">{text}</span>
        <span className="terminal-cursor">_</span>
      </span>
      <span className="terminal-hint" aria-hidden="true">
        {nudge ? '▸ dbl-click & type `help`' : '▸ dbl-click'}
      </span>
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
          onPointerDown={startBrandPress}
          onPointerMove={moveBrandPress}
          onPointerUp={cancelBrandPress}
          onPointerLeave={cancelBrandPress}
          onPointerCancel={cancelBrandPress}
          onContextMenu={(e) => e.preventDefault()}
          onClick={(e) => {
            // Long-press (touch) or triple-click (mouse) glitches the wordmark
            // instead of navigating home.
            if (longPressFired.current) {
              e.preventDefault();
              longPressFired.current = false;
              return;
            }
            if (e.detail === 3) {
              e.preventDefault();
              glitchBrand();
            }
          }}
        >
          {brandGlitch ? <ScrambleText text={brand} /> : 'SJ.SYS'}
        </NavLink>

        <div
          className={`terminal-header-box${commandMode ? ' terminal-header-box--active' : ''}${block ? ' terminal-header-box--multiline' : ''}${nudge ? ' terminal-nudge' : ''}`}
          onDoubleClick={openCommandMode}
          title="Double-click to enter a command"
        >
          {terminalBody}
        </div>

        <div className="nav-links">
          <NavLink to="/projects">PROJECTS</NavLink>
          <NavLink to="/business">BUSINESS</NavLink>
          <NavLink to="/poetry">POETRY</NavLink>
          <NavLink to="/media">MEDIA</NavLink>
          <NavLink to="/blog">BLOG</NavLink>
        </div>
      </nav>

      <div
        className={`terminal-mobile-row${commandMode ? ' terminal-header-box--active' : ''}${block ? ' terminal-header-box--multiline' : ''}${nudge ? ' terminal-nudge' : ''}`}
        onClick={() => { if (!commandMode) openCommandMode(); }}
      >
        {terminalBody}
        {!commandMode && (
          <span className="terminal-mobile-hint" aria-hidden="true">
            {nudge ? '▸ tap & type `help`' : '▸ tap to type'}
          </span>
        )}
      </div>
    </>
  );
}
