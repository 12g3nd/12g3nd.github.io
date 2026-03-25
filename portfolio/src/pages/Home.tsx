import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import './Home.css';

export default function Home() {
  return (
    <PageTransition>
      {/* HERO SECTION */}
      <section className="section info-section">
        <div className="giant-text">
          <h1>SRIHITH</h1>
          <h1 className="outline-text">JARABANA</h1>
        </div>
        <div className="badge">Rotman Commerce // Class of '2x</div>
        <div className="description-card">
          <p>
            Bridging the gap between business strategy and digital execution. 
            Welcome to my personal corner of the internet.
          </p>
          <div className="hero-actions">
            <Link to="/projects" className="btn-primary">[VIEW PROJECTS →]</Link>
            <Link to="/blog" className="btn-ghost">[READ BLOG →]</Link>
          </div>
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
            <p>Every small detail exists within a larger ecosystem. The macro and micro must align seamlessly.</p>
          </div>
          <div className="tenet-card">
            <div className="tenet-number">02</div>
            <h3><span className="accent-slash">//</span> BOLD ACTION</h3>
            <p>Better to create something polarizing than something entirely forgettable in a sea of sameness.</p>
          </div>
          <div className="tenet-card">
            <div className="tenet-number">03</div>
            <h3><span className="accent-slash">//</span> RELENTLESS EXECUTION</h3>
            <p>Ideas hold no weight without the technical precision to actually bring them into reality.</p>
          </div>
        </div>
      </section>

      {/* CONNECT SECTION */}
      <section className="section contact-section">
        <div className="section-header">
          <h2>CONNECT_</h2>
        </div>
        <a href="mailto:srihith@example.com" className="email-box">
          <span className="email-text">HELLO@SRIHITH.SYS</span>
        </a>
        <div className="social-links">
          <a href="#" className="social-pill">[LINKEDIN ↗]</a>
          <a href="#" className="social-pill">[GITHUB ↗]</a>
        </div>
      </section>
    </PageTransition>
  );
}
