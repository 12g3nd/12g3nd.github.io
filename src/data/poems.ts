/**
 * Every poem's metadata, in one place — the same arrangement src/data/posts.ts
 * already has for transmissions, and split the same way: the record lives here,
 * the body lives next door in poemContent.tsx (as a post's body lives in
 * src/content/*.mdx). A poem that has a body but no record here is invisible
 * everywhere.
 *
 * Four consumers, and they must not drift:
 *   - src/pages/Poetry.tsx          the collection (the PDF viewer)
 *   - src/pages/PoemPage.tsx        one poem per route, at /poetry/<slug>
 *   - scripts/prerenderPlugin.ts    a real HTML file per poem, with its own card
 *   - scripts/capture-og-cards.mjs  the social card PNGs
 *
 * This file is deliberately plain .ts with no imports. The prerender plugin
 * imports it directly from vite.config's module graph, and the card script
 * reads it as text — neither can survive a file that pulls in React, which is
 * exactly why the JSX is in the other file and not this one.
 */

export interface Footnote {
  /** Marker number, as printed in the verse. */
  n: number;
  text: string;
}

export interface Poem {
  /** Path segment after /poetry/ */
  slug: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  /** One-line summary, for the poem's own description and social card. */
  blurb: string;
  /** Competition placing, where there is one. */
  award?: string;
  /** Director's note — the craft behind the poem, revealed by `--director`. */
  note: string;
  /**
   * Long lines that cannot wrap without breaking the form. Renders on the
   * landscape fold-out page instead of in the portrait stack.
   */
  wide?: boolean;
  /**
   * A concrete poem: the silhouette the lines draw IS the poem, so it must
   * never be re-wrapped by a narrow viewport. See `.doc-page__shape` — it
   * scrolls sideways rather than reflowing.
   */
  shape?: boolean;
  footnotes?: readonly Footnote[];
}

export const poems: Poem[] = [
  {
    slug: 'a-ghazal-for-gaza',
    date: '2023-10-13',
    title: 'A Ghazal for Gaza',
    // The award is not repeated here: the social card prints it on its own
    // line, and the prerenderer puts it in the poem's JSON-LD.
    blurb:
      "A ghazal in the voice of a child fleeing with their aunt, every couplet landing on the same radif — '…days.'",
    award: '2024 Scholastic Arts & Writing Awards - International Silver Medal',
    note: "A ghazal: every couplet (sher) lands on the same radif, '…days,' and the form asks the poet to name themselves in the final lines. Persona piece; the 'I' isn't me.",
    wide: true,
    footnotes: [{ n: 1, text: '"Auntie" in Arabic.' }],
  },
  {
    slug: 'strawberry',
    date: '2024-12-20',
    title: 'Strawberry',
    blurb:
      'One extended conceit — the body as the fruit, achene gems and the calyx, chewed and absorbed.',
    note: 'One extended conceit: the body as the fruit. Achene "gems," the calyx, being chewed and absorbed. Sound leads the meaning here more than the other way around.',
  },
  {
    slug: 'perpetual-state-of-wanting-to-sneeze',
    date: '2025-07-29',
    title: 'Perpetual State of Wanting to Sneeze',
    blurb:
      "A refrain that mutates every time it returns, building the title's unscratchable itch into the structure.",
    note: "The refrain mutates each time it returns ('by accident' → 'again'). The title's unscratchable itch built into the structure.",
  },
  {
    slug: 'who-am-i-to-judge-another-sinner',
    date: '2026-01-02',
    title: 'Who Am I To Judge Another Sinner?',
    blurb:
      'Three-line stanzas in the voice of someone looking back at a life they half-recognize. Title after Sufjan Stevens.',
    note: 'Title inspired by Sufjan Stevens. Three-line stanzas, each closing on the rhyme; a voice looking back at a life it half-recognizes.',
  },
  {
    slug: 'a-spade-of-leaves-for-your-tears',
    date: '2023-05-11',
    title: 'A Spade of Leaves for Your Tears',
    blurb:
      'A concrete poem whose lines are set to draw a silhouette, so the outline is part of the reading. Winner, 2023 Abbey Park Poetry Contest.',
    award: 'LLCC 2nd Annual / 2023 Abbey Park Poetry Contest Winner',
    note: 'A concrete/shape poem. The lines are set to draw a silhouette, so the outline is part of the reading. My earliest piece here (2023).',
    shape: true,
  },
];

/** Poems newest-first — the order the collection reads in. */
export const poemsSorted = [...poems].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);

/** One poem by slug, or undefined when the slug isn't a known poem. */
export function poemBySlug(slug: string): Poem | undefined {
  return poems.find((p) => p.slug === slug);
}

/** A poem's 1-based position in the collection, for its printed page number. */
export function pageOf(slug: string): number {
  return poemsSorted.findIndex((p) => p.slug === slug) + 1;
}

/**
 * The poems either side of this one in reading order, for the single-poem
 * page's prev/next. The ends return undefined rather than wrapping around — a
 * collection is a finite object and should feel like one.
 */
export function poemNeighbours(slug: string): { prev?: Poem; next?: Poem } {
  const i = poemsSorted.findIndex((p) => p.slug === slug);
  if (i < 0) return {};
  return { prev: poemsSorted[i - 1], next: poemsSorted[i + 1] };
}
