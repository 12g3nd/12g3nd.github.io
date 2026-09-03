import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Poem } from '../../data/poems';
import { POEM_CONTENT } from '../../data/poemContent';
import { FootnoteList, PoemScope } from './footnotes';

/**
 * One poem, set on the cream paper stock.
 *
 * Shared by the collection (/poetry) and the single-poem route
 * (/poetry/<slug>) so the two can never typeset the same poem differently.
 * The only thing that varies is the chrome around it, which is why `titleLink`
 * is a prop rather than a branch inside here.
 */
export default function PoemPaper({
  poem,
  page,
  total,
  director,
  compact,
  titleLink = true,
}: {
  poem: Poem;
  /** 1-based position in the collection, for the printed page number. */
  page: number;
  total: number;
  /** Show the director's note above the verse. */
  director?: boolean;
  /** Shrink the verse so long lines stop wrapping on narrow screens. */
  compact?: boolean;
  /** On the poem's own page the title is not a link to itself. */
  titleLink?: boolean;
}) {
  const content = POEM_CONTENT[poem.slug];

  // A concrete poem that overflows opens scrolled hard left, which shows the
  // reader the ragged left margin of a silhouette they cannot see the rest of.
  // Centring it means the first thing on screen is the middle of the shape.
  // Re-run on `compact`, which changes how wide the verse is.
  const shapeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = shapeRef.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [compact]);

  const heading = titleLink ? (
    <Link className="doc-page__title-link" to={`/poetry/${poem.slug}`}>
      {poem.title}
    </Link>
  ) : (
    poem.title
  );

  return (
    <PoemScope slug={poem.slug}>
      <article
        id={poem.slug}
        className={[
          'doc-page',
          poem.wide ? 'doc-page--wide' : '',
          poem.award ? 'doc-page--award' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {poem.wide && (
          <span className="doc-page__foldout" aria-hidden="true">↔ FOLD-OUT</span>
        )}
        <span className="doc-page__date">{poem.date}</span>
        <h3 className="doc-page__title">{heading}</h3>
        {poem.award && <div className="doc-page__award">{poem.award}</div>}
        <hr className="doc-page__rule" />
        {director && (
          <div className="doc-page__note">
            <span className="doc-page__note-label">▸ director's note</span>
            {poem.note}
          </div>
        )}
        <div
          ref={poem.shape ? shapeRef : undefined}
          className={[
            'doc-page__body',
            compact ? 'doc-page__body--compact' : '',
            poem.shape ? 'doc-page__body--shape' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {poem.shape ? <div className="doc-page__shape">{content}</div> : content}
        </div>
        {poem.footnotes && <FootnoteList notes={poem.footnotes} />}
        <div className="doc-page__footer">— {page} / {total} —</div>
      </article>
    </PoemScope>
  );
}
