import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import StationHeader from '../components/StationHeader';
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
    poem ? `${poem.title} · Srihith Jarabana` : 'Not Found · Srihith Jarabana',
    poem?.blurb
  );

  if (!poem) return <NotFound />;

  const { prev, next } = poemNeighbours(slug);
  const page = pageOf(slug);

  return (
    <PageTransition>
      <section className="section section--poetry line--poetry" style={{ paddingBottom: '5rem' }}>
        <StationHeader
          line="poetry"
          name="Poetry"
          file="poetry.pdf"
          as="p"
          desc={<>page {page} of {poemsSorted.length} — <Link className="poem-nav__all" to="/poetry">open the whole collection</Link></>}
          meta={poem.date}
        />

        <div className="poetry-shell">
          <div className="page-tools">
            <div className="page-tools__group">
              <button
                type="button"
                className="tool-toggle"
                onClick={() => setDirector((d) => !d)}
                aria-pressed={director}
              >
                Director's commentary
              </button>
              {/* The commentary is the best writing on this page and it used to
                  sit behind an unlabelled button nobody pressed. The hint says
                  what it does without spending the reveal. */}
              <span className="poetry-tools__hint" aria-hidden="true">
                {director ? 'on: the margins talk back' : 'the margins have notes'}
              </span>
            </div>
            
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
