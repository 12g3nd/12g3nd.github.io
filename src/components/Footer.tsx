import VisitorCounter from './VisitorCounter';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="brutalist-footer">
      <div className="webring-container">
        <div className="webring-widget">
          <a href="https://uoftwebring.com/redirect?nav=prev&id=40" className="webring-nav">
            [ ← ]
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
          <a href="https://uoftwebring.com/redirect?nav=next&id=40" className="webring-nav">
            [ → ]
          </a>
        </div>

        {/* Counter, copyright, motto on one baseline. The centre column is
            `auto` and the outer two are equal fractions, so the copyright stays
            optically centred no matter how wide the count or the motto get. */}
        <div className="footer-baseline">
          <VisitorCounter />

          <p className="footer-credits">COPYRIGHT © 2026 SRIHITH JARABANA. ALL RIGHTS RESERVED.</p>

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
