import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import StationHeader from '../components/StationHeader';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { routeMeta } from '../data/routeMeta';
import { postsSorted, quarters, quarterOf, transmissionOf } from '../data/posts';
import './Blog.css';

const ALL = 'All';

/** "TRANSMISSION 06" → "06": the number each post rides under on the line. */
const numberOf = (slug: string) => transmissionOf(slug).split(' ')[1] ?? '';

/**
 * The transmissions, as a reading index: each post a stop on the site's own
 * cyan line, newest at the top, with its number and date, the title in the
 * same serif the essay is set in, the author's subtitle and the abstract.
 *
 * The sidebar used to be a "system log" of invented readings (latency,
 * region, a blinking ONLINE). What was real in it, the archive by quarter and
 * the feed, stays.
 */
export default function Blog() {
  const [filter, setFilter] = useState<string>(ALL);

  useDocumentMeta(routeMeta.blog.title, routeMeta.blog.description);

  const visible = filter === ALL
    ? postsSorted
    : postsSorted.filter((p) => quarterOf(p.date) === filter);

  return (
    <PageTransition>
      <section className="section line--transmissions">
        <StationHeader
          line="transmissions"
          name="Transmissions"
          file="transmissions.log"
          desc="essays and logs, append-only"
          meta={`${postsSorted.length} entries`}
        />

        <div className="tx-layout">
          <ol className="tx-feed">
            {visible.map((post, i) => (
              <li key={post.slug} className="tx">
                <Reveal delay={Math.min(i, 4) * 0.06}>
                  <p className="tx__meta">
                    <span className="tx__num">No. {numberOf(post.slug)}</span>
                    <time dateTime={post.date}>{post.date}</time>
                  </p>
                  <h2 className="tx__title">
                    <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  {post.subtitle && <p className="tx__subtitle">{post.subtitle}</p>}
                  <p className="tx__abstract">{post.abstract}</p>
                  <Link to={`/blog/${post.slug}`} className="line-link tx__read" aria-hidden="true" tabIndex={-1}>
                    Read full transmission →
                  </Link>
                </Reveal>
              </li>
            ))}
            {visible.length === 0 && (
              <li className="tx tx--empty">no transmissions logged this quarter.</li>
            )}
          </ol>

          <aside className="tx-aside">
            <div className="tx-aside__block">
              <h2 className="tx-aside__label">Archive</h2>
              <div className="tx-aside__filters">
                {[...quarters, ALL].map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="tool-toggle"
                    aria-pressed={filter === q}
                    onClick={() => setFilter(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="tx-aside__block">
              <h2 className="tx-aside__label">Subscribe</h2>
              <p className="tx-aside__note">
                no email, no account. point a reader at the feed and new
                transmissions arrive on their own.
              </p>
              {/* Plain anchor, not react-router Link: feed.xml is a real file
                  emitted next to index.html, so this has to leave the SPA. */}
              <a className="btn-line btn-sm" href="/feed.xml">RSS feed →</a>
            </div>
          </aside>
        </div>
      </section>
    </PageTransition>
  );
}
