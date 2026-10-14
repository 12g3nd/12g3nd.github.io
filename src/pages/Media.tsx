import { useState, type CSSProperties } from 'react';
import { films } from 'virtual:letterboxd';
import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import StationHeader from '../components/StationHeader';
import SpotifyEmbed from '../components/SpotifyEmbed';
import NowPlaying from '../components/NowPlaying';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { routeMeta } from '../data/routeMeta';
import './Media.css';

/* Two walls, deliberately. The shelves are all-time picks — a self-portrait,
   chosen once and rarely changed. The rotation below is what Spotify and
   Letterboxd happen to say right now. Keeping them apart is the point: the
   contrast between what someone returns to and what they are currently
   passing through says more than either list alone. */

/* What each shelf holds, which decides the object's shape: books and posters
   stand 2:3, records are square, a game is a box, a TV show is a screen. */
type Kind = 'book' | 'record' | 'single' | 'poster' | 'screen' | 'box';

type Item = {
  /** As written; for most shelves "Title - Creator", split for the caption. */
  text: string;
  /** public/Media/covers/<cover>.webp. Without one the item is drawn in type. */
  cover?: string;
};

type Category = {
  key: string;
  label: string;
  /** The shelf's engraving (the plates the old gallery was built on). */
  art: string;
  kind: Kind;
  /** Whether `text` carries a creator after its last " - ". Films, TV and
      games don't, and one film has a dash in its own title. */
  byline: boolean;
  items: Item[];
};

/* Covers are local copies (public/Media/covers/), fetched once from Open
   Library (books) and each work's Wikipedia article (sleeves, posters, title
   cards, box art) and shrunk to 320px; nothing on this page hotlinks a
   cover except Letterboxd's own posters below. */
const collection: Category[] = [
  {
    key: 'books',
    label: 'Books',
    art: '/Media/Books.png',
    kind: 'book',
    byline: true,
    items: [
      { text: 'East of Eden - John Steinbeck', cover: 'east-of-eden' },
      { text: 'Martin Dressler: The Tale of an American Dreamer - Steven Millhauser', cover: 'martin-dressler' },
      { text: 'Song of Solomon - Toni Morrison', cover: 'song-of-solomon' },
      { text: 'Stoner - John Williams', cover: 'stoner' },
      { text: 'The Crucible - Arthur Miller', cover: 'the-crucible' },
    ],
  },
  {
    key: 'poetry',
    label: 'Poetry',
    art: '/Media/Poetry.png',
    kind: 'book',
    byline: true,
    items: [
      { text: 'Ariel - Sylvia Plath', cover: 'ariel' },
      { text: 'Night Sky With Exit Wounds - Ocean Vuong', cover: 'night-sky' },
      { text: 'Serious Concerns - Wendy Cope', cover: 'serious-concerns' },
    ],
  },
  {
    /* Albums, songs and films each have a live counterpart further down, so
       they say all-time out loud rather than letting a feed contradict them. */
    key: 'albums',
    label: 'Albums · all-time',
    art: '/Media/Albums.png',
    kind: 'record',
    byline: true,
    items: [
      { text: 'beerbongs & bentleys - Post Malone', cover: 'beerbongs' },
      { text: 'songs - Adrienne Lenker', cover: 'songs-lenker' },
      { text: 'Live on Red Barn Radio I & II - Tyler Childers', cover: 'red-barn' },
      { text: 'Around Fur - Deftones', cover: 'around-fur' },
    ],
  },
  {
    key: 'songs',
    label: 'Songs · all-time',
    art: '/Media/Songs.png',
    kind: 'single',
    byline: true,
    items: [
      { text: 'SICKO MODE - Travis Scott ft. Drake', cover: 'sicko-mode' },
      { text: 'Rattlesnake - Jack Van Cleaf ft. Zach Bryan' },
      { text: 'Run Away With Me - Carly Rae Jepsen', cover: 'run-away' },
      { text: 'NOT FAIR - The Kid LAROI ft. Corbin', cover: 'not-fair' },
      { text: 'Fast Car - Tracy Chapman', cover: 'fast-car' },
    ],
  },
  {
    key: 'films',
    label: 'Films · all-time',
    art: '/Media/Films.png',
    kind: 'poster',
    byline: false,
    items: [
      { text: 'Catch Me If You Can (2002)', cover: 'catch-me' },
      { text: '10 Things I Hate About You (1999)', cover: '10-things' },
      { text: 'Star Wars: Episode III - Revenge of the Sith (2005)', cover: 'sith' },
      { text: 'Fantastic Mr. Fox (2009)', cover: 'mr-fox' },
    ],
  },
  {
    key: 'tv',
    label: 'TV',
    art: '/Media/TV.png',
    kind: 'screen',
    byline: false,
    items: [
      { text: 'Suits' },
      { text: 'Henry Danger', cover: 'henry-danger' },
      { text: 'Mindhunter' },
      { text: 'South Park', cover: 'south-park' },
    ],
  },
  {
    key: 'games',
    label: 'Games',
    art: '/Media/Games.png',
    kind: 'box',
    byline: false,
    items: [
      { text: 'Minecraft', cover: 'minecraft' },
      { text: 'Fallout: New Vegas', cover: 'new-vegas' },
      { text: 'Halo 3', cover: 'halo-3' },
      { text: 'Stardew Valley', cover: 'stardew' },
    ],
  },
  {
    key: 'other',
    label: 'Other',
    art: '/Media/Other.png',
    kind: 'book',
    byline: true,
    items: [
      { text: 'Shareholder Letters - Warren Buffett' },
      { text: 'neal.fun' },
      { text: 'The Yellow Wallpaper - Charlotte Perkins Gilman', cover: 'yellow-wallpaper' },
      { text: 'The Ones Who Walk Away from Omelas - Ursula K. Le Guin', cover: 'omelas' },
    ],
  },
];

/* Both playlists are titled in decorative Unicode (small-caps and double-struck
   mathematical alphanumerics). Spotify's own markup inside the iframe carries
   those glyphs, but every label written here is plain ASCII: a screen reader
   announces "𝕋ℍ𝔼 𝕃𝔸𝔼𝕋𝕌𝕊 𝕋𝔸ℙ𝔼" one codepoint at a time, or skips it entirely. */
const playlists = [
  { id: '3O7K2iaWUxqpCaWfxJxiKf', label: 'A PURGATORY OF SAFE & INSUFFERABLE' },
  { id: '5rf3uGwkVsXQtUxiEYALE3', label: 'THE LAETUS TAPE' },
];

/* The preview: the latest few logs, newest first. A cache written before
   watch dates were recorded has none, so it falls back to the feed's own
   order, which is also newest first. */
const PREVIEW = 6;
const latest = [...films]
  .map((film, i) => ({ film, i }))
  .sort((a, b) => (b.film.logged ?? '').localeCompare(a.film.logged ?? '') || a.i - b.i)
  .slice(0, PREVIEW)
  .map(({ film }) => film);

type Film = (typeof films)[number];

function FilmTile({ film }: { film: Film }) {
  return (
    <li>
      <a href={film.link} target="_blank" rel="noreferrer">
        <span className="cover cover--poster">
          {film.poster ? (
            <img src={film.poster} alt="" loading="lazy" decoding="async" />
          ) : (
            <span className="cover__title">{film.title}</span>
          )}
        </span>
        <span className="rated__title">
          {film.title} <span className="rated__year">{film.year}</span>
        </span>
        <span className="rated__stars">
          <span aria-hidden="true">{film.stars}</span>
          <span className="sr-only">{film.rating} out of 5</span>
          {film.liked && <span className="rated__like" title="liked">♥</span>}
        </span>
      </a>
    </li>
  );
}

function split(text: string, byline: boolean): { title: string; by?: string } {
  if (!byline) return { title: text };
  const at = text.lastIndexOf(' - ');
  return at < 0 ? { title: text } : { title: text.slice(0, at), by: text.slice(at + 3) };
}

/* A spread of inks for the items drawn in type, picked by the title so a
   given item always gets the same one. They are objects, so they keep their
   colours in either theme. */
const SPINE_INKS = ['#f58025', '#c4472a', '#2c5f8a', '#3d7a4f', '#7a3f6e', '#b8902f'];
const inkFor = (s: string) => SPINE_INKS[[...s].reduce((n, c) => n + c.charCodeAt(0), 0) % SPINE_INKS.length];

function ShelfItem({ item, kind, byline }: { item: Item; kind: Kind; byline: boolean }) {
  const { title, by } = split(item.text, byline);
  return (
    <li className="shelf__item">
      {item.cover ? (
        <span className={`cover cover--${kind}`}>
          <img src={`/Media/covers/${item.cover}.webp`} alt="" loading="lazy" decoding="async" />
        </span>
      ) : (
        <span className={`cover cover--${kind} cover--type`} style={{ '--ink': inkFor(title) } as CSSProperties} aria-hidden="true">
          <span className="cover__title">{title}</span>
          {by && <span className="cover__by">{by}</span>}
        </span>
      )}
      <span className="shelf__plank" aria-hidden="true" />
      <span className="shelf__caption">
        <span className="shelf__title">{title}</span>
        {by && <span className="shelf__by">{by}</span>}
      </span>
    </li>
  );
}

export default function Media() {
  useDocumentMeta(routeMeta.media.title, routeMeta.media.description);
  const [allFilms, setAllFilms] = useState(false);

  return (
    <PageTransition>
      <section className="section line--media">
        <StationHeader
          line="media"
          name="Media"
          file="fav media.dat"
          desc="the media I enjoy"
          meta={`${collection.length} shelves · est. one human`}
        />

        <div className="shelves">
          {collection.map((category, i) => (
            <Reveal key={category.key} delay={Math.min(i, 3) * 0.05}>
              <section className={`shelf shelf--${category.kind}`} aria-labelledby={`shelf-${category.key}`}>
                <header className="shelf__head">
                  <img className="shelf__emblem" src={category.art} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                  <h2 id={`shelf-${category.key}`}>{category.label}</h2>
                  <span className="shelf__count">
                    {category.items.length} {category.items.length === 1 ? 'entry' : 'entries'}
                  </span>
                </header>
                <ul className="shelf__row">
                  {category.items.map((item) => (
                    <ShelfItem key={item.text} item={item} kind={category.kind} byline={category.byline} />
                  ))}
                </ul>
              </section>
            </Reveal>
          ))}
        </div>

        {/* ── On rotation ─────────────────────────────────────────
            Wired to accounts rather than chosen. */}
        <div className="page-tools media-live-head">
          <div className="page-tools__group">
            <h2>On rotation</h2>
          </div>
          <span>
            {playlists.length} playlists{films.length > 0 && ` · ${films.length} rated films`}
          </span>
        </div>

        <NowPlaying />

        <div className="media-playlists">
          {playlists.map((playlist) => (
            <figure className="media-playlist" key={playlist.id}>
              <SpotifyEmbed id={playlist.id} label={playlist.label} />
              <figcaption>{playlist.label}</figcaption>
            </figure>
          ))}
        </div>

        {/* Rendered from ratings, not watch dates: the feed holds a handful of
            logs spread over years, and calling that "recently watched" would
            claim a freshness the account does not have. Baked at build time —
            see scripts/letterboxdPlugin.ts. */}
        {films.length > 0 && (
          <section className="shelf shelf--rated" aria-labelledby="shelf-rated">
            <header className="shelf__head">
              <h2 id="shelf-rated">Rated on Letterboxd</h2>
              <span className="shelf__count">
                {films.length} {films.length === 1 ? 'film' : 'films'}
              </span>
              <a className="btn-line btn-sm shelf__more" href="https://letterboxd.com/solder/" target="_blank" rel="noreferrer">
                All on Letterboxd ↗
              </a>
            </header>
            <p className="rated__label">{allFilms ? 'All of them, best first' : 'Latest logs'}</p>
            <ul className="rated" id="rated-films">
              {(allFilms ? films : latest).map((film) => (
                <FilmTile key={film.link} film={film} />
              ))}
            </ul>
            {films.length > PREVIEW && (
              <button
                type="button"
                className="rated__toggle"
                aria-expanded={allFilms}
                aria-controls="rated-films"
                onClick={() => setAllFilms((v) => !v)}
              >
                {allFilms ? 'Show fewer ▴' : `Show all ${films.length} ▾`}
              </button>
            )}
          </section>
        )}
      </section>
    </PageTransition>
  );
}
