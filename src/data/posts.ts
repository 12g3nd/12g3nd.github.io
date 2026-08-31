export interface Post {
  /** path segment after /blog/ */
  slug: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  abstract: string;
}

export const posts: Post[] = [
  {
    slug: 'whats-a-god-to-a-non-believer',
    date: '2026-08-31',
    title: "What's a God to a Non-Believer",
    abstract:
      'On still putting my hands together for a god I stopped believing in at fourteen, the difference between refusing to believe and failing to, and what you do with an inheritance you never signed for.',
  },
  {
    slug: 'performative',
    date: '2026-07-28',
    title: 'Performative',
    abstract:
      "On the word I can't stand being called, the LinkedIn charade I can't stand playing, and not knowing whether refusing to play it is conviction or just losing.",
  },
  {
    slug: 'doesnt-have-to-be-from-anywhere',
    date: '2026-06-22',
    title: "Doesn't Have to Be From Anywhere",
    abstract:
      "A near-midnight GO train between an old hometown and a new one, and what it means to notice a constant while it's still happening, before you find out it was sacred.",
  },
  {
    slug: 'wanting-things',
    date: '2026-05-30',
    title: 'On Wanting Things You Might Not Get',
    abstract:
      'On ambition said out loud, the quiet cost of shrinking your wants, and why failing in public beats never trying at all.',
  },
  {
    slug: 'brutalist-y2k',
    date: '2026-03-26',
    title: 'Embracing Brutalist X Y2K Aesthetics in Web Design',
    abstract:
      'Why I chose to abandon Tailwind for this iteration of my portfolio. The importance of structure over polish in a landscape of identical SaaS sites.',
  },
];

/** Posts newest-first. */
export const postsSorted = [...posts].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);

/** "2026 / Q2" from a YYYY-MM-DD string (parsed as UTC to avoid TZ drift). */
export function quarterOf(date: string): string {
  const d = new Date(date);
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return `${d.getUTCFullYear()} / Q${q}`;
}

/** Unique quarter labels present in the post list, newest-first. */
export const quarters: string[] = Array.from(
  new Set(postsSorted.map((p) => quarterOf(p.date)))
);
