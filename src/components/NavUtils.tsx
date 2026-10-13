import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTheme, toggleTheme, type Theme } from '../utils/theme';

/**
 * The two boxes at the end of the nav: a light switch and a letter.
 *
 * The theme toggle is drawn as an actual wall light switch, leaning with the
 * stripes, because that is what it is: lights off is the navy site, lights on
 * is the paper one, and the lever sits down or up to match. It reads the <html> class rather than
 * keeping its own copy of the theme, so it stays right whichever way the
 * theme last changed — here, the terminal's `theme light`, or the ⌘K palette.
 *
 * The letter goes to CONNECT on the home page (`/#connect`); ScrollRestoration
 * waits for that section to mount and scrolls to it.
 *
 * Rendered twice, like the terminal: in the nav bar on desktop and at the end
 * of the terminal row on phones. Navigation.css decides which one shows.
 */
export default function NavUtils({ placement }: { placement: 'bar' | 'row' }) {
  const [theme, setTheme] = useState<Theme>(() => getTheme());

  useEffect(() => {
    const obs = new MutationObserver(() => setTheme(getTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const lightsOn = theme === 'light';

  return (
    // Clicks are stopped here so the phone row's own handler (which opens the
    // command line) does not fire when someone flips the switch.
    <div className={`nav-utils nav-utils--${placement}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={`nav-util nav-util--switch${lightsOn ? ' is-on' : ''}`}
        aria-pressed={lightsOn}
        aria-label={lightsOn ? 'Lights off: switch to the dark theme' : 'Lights on: switch to the light theme'}
        title={lightsOn ? 'Lights off' : 'Lights on'}
        onClick={() => setTheme(toggleTheme())}
      >
        {/* The plate leans with the stripes (the same 20°), so it sits in the
            panel's slanted corner instead of standing upright against it. The
            skew is on the group, so the lever slides along the lean too. */}
        <svg className="nav-util__icon" viewBox="-6 0 30 32" aria-hidden="true">
          <g transform="skewX(-20) translate(5.8 0)">
            <rect className="switch__plate" x="3" y="1" width="18" height="30" rx="2.5" />
            <circle className="switch__screw" cx="12" cy="4.6" r="1.1" />
            <circle className="switch__screw" cx="12" cy="27.4" r="1.1" />
            <rect className="switch__slot" x="8.5" y="8.5" width="7" height="15" rx="1.4" />
            <rect className="switch__lever" x="9.4" y="15.6" width="5.2" height="7" rx="1" />
          </g>
        </svg>
      </button>
      <Link
        to="/#connect"
        className="nav-util nav-util--mail"
        aria-label="Contact: go to Connect on the home page"
        title="Contact"
      >
        <svg className="nav-util__icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2.5" y="5" width="19" height="14" rx="1.5" />
          <path d="M3 6.2 12 13l9-6.8" />
        </svg>
      </Link>
    </div>
  );
}
