
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Navigation.css';

const PHRASES = [
  "> scanning user... name: srihith jarabana... status: building things",
  "> clout: max, aura: unmatched",
  "> running diagnostics... critical error: caffeine levels low.",
  "> current aesthetic: brutalism x y2k.",
  "> location ping: robarts library, 12th floor. status: on the grind.",
  "> fit check... evaluating... result: old money."
];

export default function Navigation() {
  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
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
  }, [text, isDeleting, phraseIndex]);

  return (
    <nav className="brutalist-nav">
      <Link to="/" className="nav-brand">SJ.SYS</Link>

      <div className="terminal-header-box">
        <span className="terminal-text">{text}</span>
        <span className="terminal-cursor">_</span>
      </div>

      <div className="nav-links">
        <Link to="/projects">PROJECTS</Link>
        <Link to="/media">MEDIA</Link>
        <Link to="/poetry">POETRY</Link>
        <Link to="/blog">BLOG</Link>
      </div>
    </nav>
  );
}
