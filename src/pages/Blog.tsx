import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import './Blog.css';

export default function Blog() {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + now.getMilliseconds().toString().padStart(3, '0'));
    }, 47);
    return () => clearInterval(interval);
  }, []);

  return (
    <PageTransition>
      <section className="section">
        <div className="section-header">
          <h2>TRANSMISSIONS</h2>
        </div>
        
        <div className="blog-layout">
          {/* Main Content */}
          <div className="blog-feed">
            {[
              { 
                date: '2026-03-26', 
                title: 'Embracing Brutalist X Y2K Aesthetics in Web Design', 
                abstract: 'Why I chose to abandon Tailwind for this iteration of my portfolio. The importance of structure over polish in a landscape of identical SaaS sites.',
                link: '/blog/brutalist-y2k'
              },
            ].map((post, i) => (
              <article key={i} className="blog-post">
                <span className="post-date">[{post.date}]</span>
                <h3 className="post-title">{post.title}</h3>
                <p className="post-abstract">{post.abstract}</p>
                <Link to={post.link} className="post-link">
                  [READ_FULL_TRANSMISSION →]
                </Link>
              </article>
            ))}
          </div>
          
          {/* Sidebar */}
          <aside className="blog-sidebar">
            <div className="system-log-box">
              <h4>[SYSTEM_LOG]</h4>
              <ul>
                <li><span>&gt;</span> STATUS: <span className="blink-text status-online">ONLINE</span></li>
                <li><span>&gt;</span> LOCAL_TIME: <br/><span className="time-display">{timeStr || 'LOADING...'}</span></li>
                <li><span>&gt;</span> LATENCY: 24ms</li>
                <li><span>&gt;</span> REGION: ON_CA</li>
              </ul>
            </div>

            <div className="sidebar-section">
              <h4>[QUICK_SEEK]</h4>
              <ul className="quick-seek-list">
                <li>
                  <Link to="/blog" onClick={() => window.scrollTo(0, 0)}>
                    <span className="seek-bullet">■</span> 2026 / Q1
                  </Link>
                </li>
                <li>
                  <Link to="/blog" onClick={() => window.scrollTo(0, 0)}>
                    <span className="seek-bullet">■</span> ARCHIVE_ROOT
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </PageTransition>
  );
}
