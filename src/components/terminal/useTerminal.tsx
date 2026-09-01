import { useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLateNight, age } from '../../utils/time';
import { applyTheme } from '../../utils/theme';
import { PHRASES, LATE_NIGHT_PHRASE, ROUTES, LS_ENTRIES, COMPLETIONS } from './terminal.data';

/**
 * The nav bar's terminal: the idle typewriter, the command line it becomes, and
 * the interpreter behind it.
 *
 * This is a hook rather than a component because the terminal is rendered twice
 * — once inside the nav for desktop, once in a row below it for mobile — from a
 * single piece of state. Two components sharing one hook keeps the markup
 * identical to what a single component produced while letting each sit in its
 * own parent. See TerminalBody, and Navigation for the two mount points.
 *
 * The matrix and party effects live here too, because the commands that trigger
 * them do. Navigation reads them back to render the overlays.
 *
 * It is a .tsx file because `ls` renders React nodes rather than a string.
 */
export default function useTerminal() {
  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const [commandMode, setCommandMode] = useState(false);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [outputNode, setOutputNode] = useState<ReactNode>(null);
  const [expanded, setExpanded] = useState(false);

  const [matrix, setMatrix] = useState(false);
  const [party, setParty] = useState(false);

  const historyRef = useRef<string[]>([]);
  const histPos = useRef(0);

  const navigate = useNavigate();

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

  useEffect(() => {
    if (commandMode) return; // pause typewriter while typing commands

    const currentPhrase = phrases[phraseIndex];
    let typingSpeed = isDeleting ? 30 : 60;

    if (!isDeleting && text === currentPhrase) {
      typingSpeed = 3000;
      const timer = setTimeout(() => setIsDeleting(true), typingSpeed);
      return () => clearTimeout(timer);
    } else if (isDeleting && text === '') {
      // Scheduled rather than set synchronously: a straight setState here runs
      // during the effect and forces an immediate second render pass. A short
      // timer both avoids that and gives the caret a beat of empty line before
      // the next phrase starts typing, which reads better than an instant jump.
      const timer = setTimeout(() => {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }, 400);
      return () => clearTimeout(timer);
    }

    const timeout = setTimeout(() => {
      setText(currentPhrase.substring(0, text.length + (isDeleting ? -1 : 1)));
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIndex, commandMode, phrases]);

  // The ⌘K command palette can't reach into this hook's local state, so it
  // asks for the matrix/party effects via CustomEvents (same idiom as the Home
  // crest's `sjsys:crt`). Logic is inlined rather than calling fireMatrix/
  // toggleParty so the effect needs no non-stable deps.
  useEffect(() => {
    const onMatrix = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      setMatrix(true);
      window.setTimeout(() => setMatrix(false), 4500);
    };
    const onParty = () => {
      const on = !document.body.classList.contains('party-mode');
      document.body.classList.toggle('party-mode', on);
      setParty(on);
    };
    window.addEventListener('sjsys:matrix', onMatrix);
    window.addEventListener('sjsys:party', onParty);
    return () => {
      window.removeEventListener('sjsys:matrix', onMatrix);
      window.removeEventListener('sjsys:party', onParty);
    };
  }, []);

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
        setOutput(`srihith jarabana — businessman by craft. ${age()}. probably overthinking something.`);
        break;
      case 'whoami --real':
      case 'whoami -r':
        setOutput(`srihith jarabana — ${age()}, runs on iced coffee and spite. tells people he's 'busy building' (he is, mostly, sometimes). afraid of elevators, unafraid of bad ideas. will argue art is political until you leave the party.`);
        break;
      case 'cat beliefs.txt':
      case 'cat beliefs':
        setOutput('art is political. business is personal. technology is philosophy.');
        break;
      case 'uptime':
        setOutput(`online since 2007 · ${age()} yrs · 0 full crashes (a few close calls maybe)`);
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
        applyTheme('light');
        setOutput('theme → light. cyan-on-navy is sacred; this is heresy. enjoy.');
        break;
      case 'theme dark':
        applyTheme('dark');
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

  return {
    text,
    commandMode,
    input,
    setInput,
    output,
    outputNode,
    expanded,
    setExpanded,
    nudge,
    multiline,
    block,
    matrix,
    party,
    openCommandMode,
    closeCommandMode,
    handleKeyDown,
  };
}

export type Terminal = ReturnType<typeof useTerminal>;
