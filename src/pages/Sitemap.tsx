import { Link } from 'react-router-dom';
import { buildInfo } from 'virtual:build-info';
import PageTransition from '../components/PageTransition';
import ScrambleText from '../components/ScrambleText';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { routeMeta } from '../data/routeMeta';
import { postsSorted, transmissionOf } from '../data/posts';
import { poemsSorted } from '../data/poems';
import './Sitemap.css';

/**
 * Every page on the site, as mod_autoindex would have listed it.
 *
 * The listing is derived from routeMeta, posts.ts and poems.tsx rather than
 * typed out, so a page that exists is a page that appears here — a hand-kept
 * sitemap is a sitemap that goes stale the first week.
 *
 * There is no Size column on purpose. Apache had one because it was reading a
 * filesystem; this is a client-rendered SPA and any byte count here would be a
 * number invented to complete the costume. Last-modified is real: posts and
 * poems carry their own date, and the rest carry the date of the last commit.
 */

type Row = {
  icon: 'DIR' | 'TXT' | 'IMG' | 'PDF' | 'UP';
  name: string;
  to?: string;
  href?: string;
  modified: string;
  description: string;
};

const ICONS: Record<Row['icon'], string> = {
  DIR: '[DIR]',
  TXT: '[TXT]',
  IMG: '[IMG]',
  PDF: '[PDF]',
  UP: '[..]',
};

function Listing({ heading, rows }: { heading: string; rows: Row[] }) {
  return (
    <div className="idx">
      <h3 className="idx__heading">Index of {heading}</h3>
      <table className="idx__table">
        <thead>
          <tr>
            <th className="idx__icon" scope="col"><span className="sr-only">Type</span></th>
            <th scope="col">Name</th>
            <th scope="col">Last modified</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td className="idx__icon" aria-hidden="true">{ICONS[row.icon]}</td>
              <td className="idx__name">
                {row.to ? (
                  <Link to={row.to}>{row.name}</Link>
                ) : row.href ? (
                  <a href={row.href}>{row.name}</a>
                ) : (
                  row.name
                )}
              </td>
              <td className="idx__date">{row.modified}</td>
              <td className="idx__desc">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Sitemap() {
  useDocumentMeta(routeMeta.sitemap.title, routeMeta.sitemap.description);

  const built = buildInfo.date;

  const root: Row[] = [
    { icon: 'DIR', name: 'projects/', to: '/projects', modified: built, description: 'things built, shipped or abandoned' },
    { icon: 'DIR', name: 'business/', to: '/business', modified: built, description: 'research, competitions, write-ups' },
    { icon: 'DIR', name: 'media/', to: '/media', modified: built, description: 'books, albums, films, games' },
    { icon: 'DIR', name: 'poetry/', to: '/poetry', modified: poemsSorted[0]?.date ?? built, description: 'selected poems — the third pillar' },
    { icon: 'DIR', name: 'blog/', to: '/blog', modified: postsSorted[0]?.date ?? built, description: 'transmissions' },
    { icon: 'DIR', name: 'guestbook/', to: '/guestbook', modified: built, description: 'sign it' },
    { icon: 'PDF', name: 'resume.pdf', href: '/resume.pdf', modified: built, description: 'the formal version' },
    { icon: 'TXT', name: 'feed.xml', href: '/feed.xml', modified: postsSorted[0]?.date ?? built, description: 'RSS — transmissions only' },
  ];

  const blog: Row[] = postsSorted.map((post) => ({
    icon: 'TXT',
    name: `${post.slug}.mdx`,
    to: `/blog/${post.slug}`,
    modified: post.date,
    description: transmissionOf(post.slug).toLowerCase().replace('_', ' '),
  }));

  const poetry: Row[] = poemsSorted.map((poem) => ({
    icon: 'TXT',
    name: `${poem.slug}.txt`,
    to: `/poetry/${poem.slug}`,
    modified: poem.date,
    description: poem.award ? `${poem.title} ✦` : poem.title,
  }));

  return (
    <PageTransition>
      <section className="section" style={{ paddingBottom: '5rem' }}>
        <div className="section-header">
          <h2><ScrambleText text="INDEX OF /" /></h2>
          <p className="section-desc">
            every page on this site, the way a web server would have told you about it.
          </p>
        </div>

        <div className="idx-wrap">
          <Listing
            heading="/"
            rows={[
              { icon: 'UP', name: 'Parent Directory', to: '/', modified: built, description: 'home' },
              ...root,
            ]}
          />
          <Listing heading="/blog" rows={blog} />
          <Listing heading="/poetry" rows={poetry} />

          {/* The server signature line, which is the part of these pages
              everyone actually remembers. Truthful: this really is what serves
              the site. */}
          <p className="idx__sig">
            GitHub Pages Server at www.jarabana.com Port 443
            {buildInfo.exact && buildInfo.sha && ` — build ${buildInfo.sha}`}
          </p>
        </div>
      </section>
    </PageTransition>
  );
}
