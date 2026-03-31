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
            <img
              src="https://uoftwebring.com/ring_logo.svg"
              alt="UofT Webring"
              className="webring-logo-img"
            />
          </a>
          <a href="https://uoftwebring.com/redirect?nav=next&id=40" className="webring-nav">
            [ → ]
          </a>
        </div>

        {/* SKULE WebRing Widget */}
        <div id="skule-webring" className="webring-widget">
          <a href="https://WebRing.skule.ca/#https://www.jarabana.com/?nav=prev" className="webring-nav">
            [ ← ]
          </a>
          <a href="https://WebRing.skule.ca/#https://www.jarabana.com/" target="_blank" rel="noopener noreferrer" className="webring-logo-link">
            <img
              src="https://WebRing.skule.ca/img/icon-dark.svg"
              alt="SKULE WebRing"
              className="webring-logo-img"
            />
          </a>
          <a href="https://WebRing.skule.ca/#https://www.jarabana.com/?nav=next" className="webring-nav">
            [ → ]
          </a>
        </div>

        <p className="footer-credits">COPYRIGHT © 2026 SRIHITH JARABANA. ALL RIGHTS RESERVED.</p>
      </div>
    </footer>
  );
}
