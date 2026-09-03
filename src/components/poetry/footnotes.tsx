import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Footnote } from '../../data/poems';

/**
 * The slug of the poem currently rendering.
 *
 * Footnote anchors have to be unique within a *document*, and the collection
 * page puts every poem in one document — so a bare `#fn-1` would collide the
 * moment a second poem carries a note, and every marker on the page would jump
 * to the first poem's note. Scoping the ids by slug is what lets the same
 * markup serve both the collection page and the single-poem page unchanged.
 */
const PoemSlug = createContext('');

/** Wraps one poem so its footnote anchors are namespaced to it. */
export function PoemScope({ slug, children }: { slug: string; children: ReactNode }) {
  return <PoemSlug.Provider value={slug}>{children}</PoemSlug.Provider>;
}

/** The superscript marker that sits in the verse. */
export function FnRef({ n }: { n: number }) {
  const slug = useContext(PoemSlug);
  return (
    <sup className="doc-fn-ref">
      <a id={`fnref-${slug}-${n}`} href={`#fn-${slug}-${n}`}>
        {n}
      </a>
    </sup>
  );
}

/** The notes themselves, set under the verse like real back-of-page matter. */
export function FootnoteList({ notes }: { notes: readonly Footnote[] }) {
  const slug = useContext(PoemSlug);
  if (!notes.length) return null;
  return (
    <div className="doc-fn">
      {notes.map((note) => (
        <p key={note.n} id={`fn-${slug}-${note.n}`} className="doc-fn__item">
          <span className="doc-fn__num" aria-hidden="true">{note.n}</span>
          <span className="doc-fn__text">{note.text}</span>{' '}
          {/* A footnote you cannot get back from is a dead end on a page this
              long, so every note links home to its marker. */}
          <a className="doc-fn__back" href={`#fnref-${slug}-${note.n}`} aria-label="Back to text">↩</a>
        </p>
      ))}
    </div>
  );
}
