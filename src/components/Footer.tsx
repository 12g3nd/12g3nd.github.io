import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { buildInfo } from 'virtual:build-info';
import { getTheme, toggleTheme, type Theme } from '../utils/theme';
import VisitorCounter from './VisitorCounter';
import ButtonWall from './ButtonWall';
import './Footer.css';

/**
 * The visible way into dark mode. Paper is the default for everyone; this, the
 * terminal's `theme dark` and the ⌘K palette are the three ways out of it.
 * Watches the <html> class so it stays right whichever of the three was used.
 */
function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getTheme());
  useEffect(() => {
    const obs = new MutationObserver(() => setTheme(getTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return (
    <button
      type="button"
      className="footer-theme"
      aria-pressed={theme === 'dark'}
      onClick={() => setTheme(toggleTheme())}
    >
      Dark mode {theme === 'dark' ? 'on' : 'off'}
    </button>
  );
}

export default function Footer() {
  return (
    <footer className="brutalist-footer">
      <div className="webring-container">
        <div className="webring-widget">
          <a href="https://uoftwebring.com/redirect?nav=prev&id=40" className="webring-nav" aria-label="Previous site in the UofT Webring">
            ← prev
          </a>
          <a href="https://uoftwebring.com" target="_blank" rel="noopener noreferrer" className="webring-logo-link">
            {/* Served from public/ rather than uoftwebring.com. The remote copy
                was the footer's one third-party fetch, and because it is sized
                `height: auto` the footer stood at one height before it arrived
                and another after — a layout shift on every page. Explicit
                dimensions below make that impossible; the link still points at
                the ring, only the image is local. Re-copy the file if the ring
                ever redesigns its logo. */}
            <img
              src="/ring_logo.svg"
              alt="UofT Webring"
              className="webring-logo-img"
              width="28"
              height="28"
            />
          </a>
          <a href="https://uoftwebring.com/redirect?nav=next&id=40" className="webring-nav" aria-label="Next site in the UofT Webring">
            next →
          </a>
        </div>

        {/* The button the ring was always missing, plus the badge wall. */}
        <ButtonWall />

        {/* Counter, copyright, motto on one baseline. The centre column is
            `auto` and the outer two are equal fractions, so the copyright stays
            optically centred no matter how wide the count or the motto get. */}
        <div className="footer-baseline">
          <VisitorCounter />

          <div className="footer-centre">
            <p className="footer-credits">© 2026 Srihith Jarabana. All rights reserved.</p>
            {/* The date of the last commit, not of this page load — see
                scripts/buildInfoPlugin.ts. A stamp that reads "today" every day
                is the version of this everyone got wrong. <time> so the machine
                reading gets the same fact as the human one. */}
            <p className="footer-updated">
              Last updated <time dateTime={buildInfo.date}>{buildInfo.date}</time>
              {buildInfo.exact && buildInfo.sha && (
                <span className="footer-updated__sha"> · {buildInfo.sha}</span>
              )}
              {/* The only route not in the nav, so this is the only way to
                  find it that isn't typing the URL. */}
              <span className="footer-updated__sha"> · </span>
              <Link className="footer-index" to="/sitemap">Index of /</Link>
            </p>
            <ThemeToggle />
          </div>

          {/* Both readings live in the DOM, so a screen reader gets the Latin
              and its translation without needing the hover state that reveals
              the second one visually. */}
          <p className="footer-motto" tabIndex={0}>
            <span className="footer-motto__latin">Crescere est resurgere</span>
            <span className="footer-motto__english">To grow is to rise again</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
