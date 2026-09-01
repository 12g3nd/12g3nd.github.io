import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import ScrambleText from '../components/ScrambleText';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { postsSorted, quarters, quarterOf } from '../data/posts';
import './Blog.css';

const ALL = 'ARCHIVE_ROOT';

export default function Blog() {
  const [timeStr, setTimeStr] = useState('');
  const [filter, setFilter] = useState<string>(ALL);

  useDocumentMeta(
    'Transmissions // Srihith Jarabana',
    'Essays and logs by Srihith Jarabana on ambition, design, and whatever else.'
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + now.getMilliseconds().toString().padStart(3, '0'));
    }, 47);
    return () => clearInterval(interval);
  }, []);

  const visible = filter === ALL
    ? postsSorted
    : postsSorted.filter((p) => quarterOf(p.date) === filter);

  return (
    <PageTransition>
      <section className="section">
        <div className="section-header">
          <h2><ScrambleText text="TRANSMISSIONS_" /></h2>
          <p className="section-desc">essays and logs, append-only — once a transmission goes out, I don't edit it</p>
        </div>

        {/* Log chrome: frames the feed as a live log stream inside SJ.SYS */}
        <div className="log-bar">
          <span className="log-bar__cmd"><span className="log-bar__prompt">srihith@sj.sys:~$</span> tail -f transmissions.log</span>
          <span className="log-bar__count">{postsSorted.length} entries</span>
        </div>

        <div className="blog-layout">
          {/* Main Content */}
          <div className="blog-feed">
            {visible.map((post, i) => (
              <Reveal key={post.slug} delay={i * 0.08}>
                <article className="blog-post">
                  <span className="post-date">[{post.date}]</span>
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-abstract">{post.abstract}</p>
                  <Link to={`/blog/${post.slug}`} className="post-link">
                    [READ_FULL_TRANSMISSION →]
                  </Link>
                </article>
              </Reveal>
            ))}
            {visible.length === 0 && (
              <p className="blog-empty">// no transmissions logged this quarter.</p>
            )}
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
                <li><span>&gt;</span> WRITE_MODE: APPEND_ONLY</li>
              </ul>
            </div>

            <div className="sidebar-section">
              <h4>[QUICK_SEEK]</h4>
              <ul className="quick-seek-list">
                {quarters.map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      className={`seek-btn${filter === q ? ' seek-btn--active' : ''}`}
                      onClick={() => setFilter(q)}
                    >
                      <span className="seek-bullet">■</span> {q}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    className={`seek-btn${filter === ALL ? ' seek-btn--active' : ''}`}
                    onClick={() => setFilter(ALL)}
                  >
                    <span className="seek-bullet">■</span> {ALL}
                  </button>
                </li>
              </ul>
            </div>

            <div className="sidebar-section">
              <h4>[SUBSCRIBE]</h4>
              <p className="feed-note">
                no email, no account. point a reader at the feed and new
                transmissions arrive on their own.
              </p>
              {/* Plain anchor, not react-router Link: feed.xml is a real file
                  emitted next to index.html, so this has to leave the SPA. */}
              <a className="post-link feed-link" href="/feed.xml">
                [RSS_FEED →]
              </a>
            </div>
          </aside>
        </div>
      </section>
    </PageTransition>
  );
}
