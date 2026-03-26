import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import './Home.css';

export default function Home() {
  return (
    <PageTransition>
      {/* HERO SECTION */}
      <section className="section info-section">
        <div className="hero-content">
          <div className="giant-text">
            <h1>SRIHITH</h1>
            <h1 className="outline-text">JARABANA</h1>
          </div>
          <div className="badge-row">
            <div className="badge">Rotman Commerce // Class of '29</div>
            <img src="/crest.png" alt="University Crest" className="crest-icon" />
          </div>
          <div className="description-card">
            <p>
              'SJ' also welcome. Businessman by craft. Also, heavy STEM and literature background.
              Welcome to my personal (and humble) corner of the internet.
            </p>
            <div className="hero-actions">
              <Link to="/projects" className="btn-primary">[VIEW PROJECTS →]</Link>
              <Link to="/blog" className="btn-ghost">[READ BLOG →]</Link>
            </div>
          </div>
        </div>
        <div className="hero-figure">
          <img src="/figure.png" alt="Wireframe Figure" />
        </div>
      </section>

      {/* TENETS SECTION */}
      <section className="section tenets-section">
        <div className="section-header">
          <h2 className="tenets-title">TENETS</h2>
        </div>
        <div className="divider-line"></div>
        <div className="tenets-grid">
          <div className="tenet-card">
            <div className="tenet-number">01</div>
            <h3><span className="accent-slash">//</span> SYSTEMS THINKING</h3>
            <p>Being content ≠ being happy. Don't settle just because you've given up. Chase passion instead of paper & prestige.</p>
          </div>
          <div className="tenet-card">
            <div className="tenet-number">02</div>
            <h3><span className="accent-slash">//</span> ENTERTAIN THE MUNDANE</h3>
            <p>It's better to create something polarizing than something entirely forgettable. The small things do matter, but so does the big picture.</p>
          </div>
          <div className="tenet-card">
            <div className="tenet-number">03</div>
            <h3><span className="accent-slash">//</span> ARTIFICIAL INTELLIGENCE</h3>
            <p>The future will include AI. Learn to use it properly. Don't get dependant / complacent. "Life, uh, finds a way" or something like that.</p>
          </div>
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
            </div>

            <div className="quotes-block">
              <h4>[REFERENCE_QUOTES]</h4>
              <div className="quote-item">
                <p>"You only live once, but if you do it right, once is enough"</p>
                <span>— Mae West</span>
              </div>
              <div className="quote-item">
                <p>"In three words I can sum up everything I've learned about life: It goes on."</p>
                <span>— Robert Frost</span>
              </div>
              <div className="quote-item">
                <p>"It is the mark of an educated mind, to entertain a thought without accepting it"</p>
                <span>— Aristotle</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONNECT SECTION */}
      <section className="section contact-section">
        <div className="section-header">
          <h2>CONNECT_</h2>
        </div>
        <a href="mailto:srihith.jarabana@mail.utoronto.ca" className="email-box">
          <span className="email-text">srihith.jarabana@mail.utoronto.ca</span>
        </a>
        <div className="social-links">
          <a href="https://www.linkedin.com/in/srihithjarabana/" target="_blank" rel="noopener noreferrer" className="social-pill">[LINKEDIN ↗]</a>
          <a href="https://github.com/12g3nd" target="_blank" rel="noopener noreferrer" className="social-pill">[GITHUB ↗]</a>
        </div>
      </section>
    </PageTransition>
  );
}
