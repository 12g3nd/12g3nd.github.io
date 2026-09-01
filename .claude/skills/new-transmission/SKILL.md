---
name: new-transmission
description: Use when adding, publishing, or drafting a new blog post ("transmission") on this site — creating the MDX, registering it in posts.ts, generating its social card, and verifying the feed and prerendered page. Also use when a post exists but is not appearing on /blog, in feed.xml, or has the wrong social card.
---

# Adding a transmission

A post is not one file. It is one file plus one registration, and four separate
surfaces read the registration. A post that exists as MDX but is missing from
`src/data/posts.ts` is invisible to every one of them — no archive entry, no
feed item, no prerendered page, no social card. That is the failure this
procedure exists to prevent.

## 1. Write the content

`src/content/<slug>.mdx` — **no frontmatter**. The file is prose only; all
metadata lives in step 2. Slugs are lowercase, hyphenated, and permanent: the
slug is the URL, the feed GUID, and the social card filename, so renaming one
after publishing breaks links that already exist.

MDX means JSX is available in the prose. The house convention is a lede
paragraph where a post needs a visual beat before its substance:

```jsx
<p className="lede">One line that sets up what follows.</p>
```

Images go in `public/blog<N>/` at web weight. Full-resolution originals stay
local — the repo `.gitignore` deliberately excludes root-level images so drafts
and source photos never ship.

## 2. Register it

Add to the top of the `posts` array in `src/data/posts.ts`:

```ts
{
  slug: '<slug>',            // must match the .mdx filename exactly
  date: 'YYYY-MM-DD',
  title: '...',
  abstract: '...',           // one or two sentences; used by the feed and the card
}
```

`postsSorted` orders by date, so array position is cosmetic — but keep it
newest-first so the file reads the way the site does.

The abstract is public writing, not a note to self: it is the `<description>` in
`feed.xml`, the text on the social card, and the blurb on `/blog`.

## 3. Generate the social card

```bash
node scripts/capture-og-cards.mjs <slug>
```

Writes `public/og/<slug>.png`. **Commit the PNG.** It is generated locally on
purpose so CI stays a plain `npm ci && vite build` with no browser download.
`scripts/prerenderPlugin.ts` uses the file if it exists and falls back to the
site-wide card if it does not, so forgetting this degrades quietly rather than
404ing — which is exactly why it is easy to forget.

## 4. Add it to the visual baseline

Add the route to `ROUTES` in `scripts/visual.mjs`, so the post is covered when
anything touches `BlogPost.css` or `PostLayout`.

## 5. Verify before pushing

```bash
npm run build
```

Then confirm all four surfaces actually picked it up:

- `dist/blog/<slug>/index.html` exists and its `<title>`/OG tags are the post's,
  not the homepage's
- `dist/feed.xml` contains the post
- `/blog` lists it
- `public/og/<slug>.png` exists and is the new card

A push to `main` deploys. There is no staging step, so this list is the review.
