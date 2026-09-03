import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import ScrambleText from '../components/ScrambleText';
import PoemPaper from '../components/poetry/PoemPaper';
import NotFound from './NotFound';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { pageOf, poemBySlug, poemNeighbours, poemsSorted } from '../data/poems';
import './poetry/index.css';

/**
 * One poem on its own route, so a single piece can be linked, shared and
 * scraped on its own terms. The collection at /poetry stays the place you read
 * them all; this is the page you send someone.
 */
export default function PoemPage() {
  const { slug = '' } = useParams();
  const poem = poemBySlug(slug);
  const [director, setDirector] = useState(false);

  // Called unconditionally (rules of hooks); falls back for the missing case.
  useDocumentMeta(
    poem ? `${poem.title} // Srihith Jarabana` : 'Not Found // Srihith Jarabana',
    poem?.blurb
  );

  if (!poem) return <NotFound />;

  const { prev, next } = poemNeighbours(slug);
  const page = pageOf(slug);

  return (
    <PageTransition>
      <section className="section section--poetry" style={{ paddingBottom: '5rem' }}>
        <div className="section-header">
          <h2><ScrambleText text="POETRY.PDF" /></h2>
          <p className="section-desc">
            page {page} of {poemsSorted.length} — <Link className="poem-nav__all" to="/poetry">open the whole collection</Link>
          </p>
        </div>

        <div className="poetry-shell">
          <div className="poetry-bar">
            <button
              type="button"
              className="poetry-bar__cmd"
              onClick={() => setDirector((d) => !d)}
              aria-pressed={director}
              title="run command"
            >
              <span className="poetry-bar__prompt">srihith@sj.sys:~$</span> open poetry.pdf --page={page}
              {director ? ' --director' : ''}
            </button>
            <span className="poetry-bar__hint" aria-hidden="true">
              {director ? 'commentary on — click to hide' : 'try the --director flag'}
            </span>
            <span className="poetry-bar__count">{poem.date}</span>
          </div>

          <div className="doc-viewer">
            <div className="doc-viewer__chrome">
              <span className="doc-viewer__filename">{poem.slug}.pdf</span>
              <span className="doc-viewer__meta">1 page · serif</span>
            </div>
            <div className="doc-viewer__pages">
              <Reveal>
                <PoemPaper
                  poem={poem}
                  page={page}
                  total={poemsSorted.length}
                  director={director}
                  titleLink={false}
                />
              </Reveal>
            </div>
          </div>

          {/* Prev/next in reading order. The ends of the collection show a dead
              slot rather than wrapping, so the shape of the book stays legible. */}
          <nav className="poem-nav" aria-label="More poems">
            {prev ? (
              <Link className="poem-nav__link poem-nav__link--prev" to={`/poetry/${prev.slug}`}>
                <span className="poem-nav__dir">← newer</span>
                <span className="poem-nav__title">{prev.title}</span>
              </Link>
            ) : (
              <span className="poem-nav__end">— start of collection —</span>
            )}
            {next ? (
              <Link className="poem-nav__link poem-nav__link--next" to={`/poetry/${next.slug}`}>
                <span className="poem-nav__dir">older →</span>
                <span className="poem-nav__title">{next.title}</span>
              </Link>
            ) : (
              <span className="poem-nav__end">— end of collection —</span>
            )}
          </nav>
        </div>
      </section>
    </PageTransition>
  );
}
