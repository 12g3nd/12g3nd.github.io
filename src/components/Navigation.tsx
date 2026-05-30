
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

const ROUTES: Record<string, string> = {
  projects: '/projects',
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

  const navigate = useNavigate();

  useEffect(() => {
    if (commandMode) return; // pause typewriter while typing commands

    const currentPhrase = PHRASES[phraseIndex];
    let typingSpeed = isDeleting ? 30 : 60;

    if (!isDeleting && text === currentPhrase) {
      typingSpeed = 3000;
      const timer = setTimeout(() => setIsDeleting(true), typingSpeed);
      return () => clearTimeout(timer);
    } else if (isDeleting && text === '') {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
      return;
    }

    const timeout = setTimeout(() => {
      setText(currentPhrase.substring(0, text.length + (isDeleting ? -1 : 1)));
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIndex, commandMode]);

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
  };

  const runCommand = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;

    if (cmd in ROUTES) {
      navigate(ROUTES[cmd]);
      window.scrollTo(0, 0);
      closeCommandMode();
      return;
    }

    switch (cmd) {
      case 'help':
        setOutput('commands: projects · media · poetry · blog · home · whoami · ls · clear · exit');
        break;
      case 'whoami':
        setOutput('srihith jarabana — businessman by craft. 19. probably overthinking something.');
        break;
      case 'ls':
        setOutput('projects/   media/   poetry/   blog/');
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

  const terminalBody = commandMode ? (
    <div className="terminal-cmd">
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
      {output && <span className="terminal-output">{output}</span>}
    </div>
  ) : (
    <>
      <span className="terminal-text">{text}</span>
      <span className="terminal-cursor">_</span>
    </>
  );

  return (
    <>
      <nav className="brutalist-nav">
        <NavLink to="/" className="nav-brand">SJ.SYS</NavLink>

        <div
          className={`terminal-header-box${commandMode ? ' terminal-header-box--active' : ''}`}
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
        className={`terminal-mobile-row${commandMode ? ' terminal-header-box--active' : ''}`}
        onClick={() => { if (!commandMode) openCommandMode(); }}
      >
        {terminalBody}
      </div>
    </>
  );
}
