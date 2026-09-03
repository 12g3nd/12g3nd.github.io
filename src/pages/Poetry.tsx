import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import ScrambleText from '../components/ScrambleText';
import PoemPaper from '../components/poetry/PoemPaper';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { routeMeta } from '../data/routeMeta';
import { poemsSorted } from '../data/poems';
import './poetry/index.css';

export default function Poetry() {
  const [compactMode, setCompactMode] = useState(false);
  // Hidden "director's commentary": the open-file command in the poetry bar
  // toggles `--director`, surfacing the craft note under each poem's rule.
  const [director, setDirector] = useState(false);

  useDocumentMeta(routeMeta.poetry.title, routeMeta.poetry.description);

  const total = poemsSorted.length;

  return (
    <PageTransition>
      <section className="section section--poetry">
        <div className="section-header">
          <h2><ScrambleText text="POETRY.PDF" /></h2>
          <p className="section-desc">some of my favourite poems I've ever written at various points in my life. the third pillar.</p>
          <button
            className="poetry-compact-toggle"
            onClick={() => setCompactMode(prev => !prev)}
          >
            {compactMode ? '[NORMAL TEXT ↩]' : '[FIT TEXT →]'}
          </button>
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
              <span className="poetry-bar__prompt">srihith@sj.sys:~$</span> open poetry.pdf{director ? ' --director' : ''}
            </button>
            {/* The commentary is the best writing on this page and it used to
                sit behind an unlabelled button nobody pressed. The hint says
                what the flag does without spending the reveal. */}
            <span className="poetry-bar__hint" aria-hidden="true">
              {director ? 'commentary on — click to hide' : 'try the --director flag'}
            </span>
            <span className="poetry-bar__count">{total} poems</span>
          </div>

          <div className="doc-viewer">
            <div className="doc-viewer__chrome">
              <span className="doc-viewer__filename">POETRY.pdf</span>
              <span className="doc-viewer__meta">{total + 2} pages · serif</span>
            </div>
            <div className="doc-viewer__pages">
              {/* Title page — same paper stock, unnumbered like real front matter.
                  The contents list is the only way into a single poem from here,
                  and it is what a printed collection would carry anyway. */}
              <Reveal>
                <article className="doc-page doc-page--cover">
                  <h3 className="doc-cover__title">Selected Poems</h3>
                  <p className="doc-cover__subtitle">written since 2023 onwards</p>
                  <span className="doc-cover__ornament" aria-hidden="true">✦</span>
                  <p className="doc-cover__author">Srihith Jarabana</p>

                  <nav className="doc-toc" aria-label="Contents">
                    <h4 className="doc-toc__label">Contents</h4>
                    <ol className="doc-toc__list">
                      {poemsSorted.map((poem, i) => (
                        <li key={poem.slug} className="doc-toc__item">
                          <Link className="doc-toc__link" to={`/poetry/${poem.slug}`}>
                            <span className="doc-toc__title">
                              {poem.title}
                              {poem.award && (
                                <span className="doc-toc__medal" title={poem.award} aria-label="award-winning">✦</span>
                              )}
                            </span>
                            {/* The leader dots are a border on a flexed spacer, not
                                a string of periods — a real dot leader stretches to
                                whatever gap the title leaves. */}
                            <span className="doc-toc__leader" aria-hidden="true" />
                            <span className="doc-toc__page">{i + 1}</span>
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </nav>
                </article>
              </Reveal>

              {poemsSorted.map((poem, i) => (
                <Reveal key={poem.slug} delay={Math.min(i, 3) * 0.06}>
                  <PoemPaper
                    poem={poem}
                    page={i + 1}
                    total={total}
                    director={director}
                    compact={compactMode}
                  />
                </Reveal>
              ))}

              {/* Acknowledgements — the back-matter bookend to the title page. */}
              <Reveal>
                <article className="doc-page doc-page--ack">
                  <h3 className="doc-ack__title">Acknowledgements</h3>
                  <p className="doc-ack__body">
                    To family, friends, and everybody who has ever genuinely believed in me.
                  </p>
                  <div className="doc-page__footer">— end —</div>
                </article>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
