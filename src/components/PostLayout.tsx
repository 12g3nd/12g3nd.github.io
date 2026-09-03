import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { postsSorted } from '../data/posts';
import './PostLayout.css';

interface PostLayoutProps {
  /** current post slug, used to exclude it from "other transmissions" */
  slug: string;
  /** YYYY-MM-DD, shown in the meta box */
  date: string;
  children: ReactNode;
}

/**
 * Two-column reading layout for blog posts: article on the left, a sticky
 * "transmission" rail on the right (reading progress, computed meta, links to
 * the other posts). Collapses to a single column under 900px.
 */
export default function PostLayout({ slug, date, children }: PostLayoutProps) {
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ words: 0, minutes: 1 });

  /* Word count + read time, measured from the rendered article text.
   *
   * A ref callback rather than an effect: measuring in an effect and calling
   * setState from its body runs a second render pass synchronously, every
   * time. React invokes this once the node is attached, which is exactly when
   * there is text to count.
   *
   * Empty deps are safe because AnimatedRoutes keys <Routes> on
   * location.pathname (see App.tsx), so moving between transmissions unmounts
   * this component rather than handing it new children — the callback runs
   * again on the new instance. If that key ever goes, this needs to re-run on
   * the article changing instead. */
  const measureContent = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const words = (node.textContent ?? '').trim().split(/\s+/).filter(Boolean).length;
    setStats({ words, minutes: Math.max(1, Math.round(words / 200)) });
  }, []);

  // Reading progress tied to scroll position.
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const others = postsSorted.filter((p) => p.slug !== slug);

  return (
    <div className="post-layout">
      <div className="post-content" ref={measureContent}>
        {children}
      </div>

      <aside className="post-sidebar">
        <div className="post-progress-box">
          <div className="post-progress-label">
            <span>[BUFFER]</span>
            <span className="post-progress-pct">{progress}%</span>
          </div>
          <div className="post-progress-track">
            <div className="post-progress-fill" style={{ '--progress': progress / 100 } as React.CSSProperties} />
          </div>
        </div>

        <div className="post-meta-box">
          <h4>[TRANSMISSION_META]</h4>
          <ul>
            <li><span className="seek-bullet">&gt;</span> DATE: <span className="post-meta-date">{date}</span></li>
            <li><span className="seek-bullet">&gt;</span> READ_TIME: <span className="post-meta-value">{stats.minutes} MIN</span></li>
            <li><span className="seek-bullet">&gt;</span> WORD_COUNT: <span className="post-meta-value">{stats.words}</span></li>
            <li><span className="seek-bullet">&gt;</span> STATUS: <span className="post-meta-status">DECRYPTED</span></li>
          </ul>
        </div>

        {others.length > 0 && (
          <div className="post-other-box">
            <h4>[OTHER_TRANSMISSIONS]</h4>
            <ul>
              {others.map((p) => (
                <li key={p.slug}>
                  <Link to={`/blog/${p.slug}`}>
                    <span className="post-other-date">{p.date}</span>
                    <span className="post-other-title">{p.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
