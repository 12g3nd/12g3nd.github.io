import { films } from 'virtual:letterboxd';
import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import ScrambleText from '../components/ScrambleText';
import useDocumentMeta from '../hooks/useDocumentMeta';
import './Media.css';

/* Two walls, deliberately. The curated plates are all-time picks — a
   self-portrait, chosen once and rarely changed. The live wall below is what
   Spotify and Letterboxd happen to say right now. Keeping them apart is the
   point: the contrast between what someone returns to and what they are
   currently passing through says more than either list alone. */

type Category = {
  key: string;
  label: string;
  art: string;
  items: string[];
};

const collection: Category[] = [
  {
    key: 'books',
    label: 'BOOKS',
    art: '/Media/Books.png',
    items: ['East of Eden - John Steinbeck', 'Martin Dressler: The Tale of an American Dreamer - Steven Millhauser', 'Song of Solomon - Toni Morrison', 'Stoner - John Williams', 'The Crucible - Arthur Miller'],
  },
  {
    key: 'poetry',
    label: 'POETRY',
    art: '/Media/Poetry.png',
    items: ['Ariel - Sylvia Plath', 'Night Sky With Exit Wounds - Ocean Vuong', 'Serious Concerns - Wendy Cope'],
  },
  {
    /* Albums, songs and films each have a live counterpart on the wall below,
       so they say all-time out loud rather than letting a feed contradict them. */
    key: 'albums',
    label: 'ALBUMS // ALL-TIME',
    art: '/Media/Albums.png',
    items: ['beerbongs & bentleys - Post Malone', 'songs - Adrienne Lenker', 'Live on Red Barn Radio I & II - Tyler Childers', 'Around Fur - Deftones'],
  },
  {
    key: 'songs',
    label: 'SONGS // ALL-TIME',
    art: '/Media/Songs.png',
    items: ['SICKO MODE - Travis Scott ft. Drake', 'Rattlesnake - Jack Van Cleaf ft. Zach Bryan', 'Run Away With Me - Carly Rae Jepsen', 'NOT FAIR - The Kid LAROI ft. Corbin', 'Fast Car - Tracy Chapman'],
  },
  {
    key: 'films',
    label: 'FILMS // ALL-TIME',
    art: '/Media/Films.png',
    items: ['Catch Me If You Can (2002)', '10 Things I Hate About You (1999)', 'Star Wars: Episode III - Revenge of the Sith (2005)', 'Fantastic Mr. Fox (2009)'],
  },
  { key: 'tv', label: 'TV', art: '/Media/TV.png', items: ['Suits', 'Henry Danger', 'Mindhunter', 'South Park'] },
  { key: 'games', label: 'GAMES', art: '/Media/Games.png', items: ['Minecraft', 'Fallout: New Vegas', 'Halo 3', 'Stardew Valley'] },
  {
    key: 'other',
    label: 'OTHER',
    art: '/Media/Other.png',
    items: ['Shareholder Letters - Warren Buffett', 'neal.fun', 'The Yellow Wallpaper - Charlotte Perkins Gilman', 'The Ones Who Walk Away from Omelas - Ursula K. Le Guin'],
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

export default function Media() {
  useDocumentMeta(
    'Media // Srihith Jarabana',
    'Books, poetry, albums, films, and games Srihith Jarabana enjoys — plus current playlists and Letterboxd ratings.'
  );

  return (
    <PageTransition>
      <section className="section">
        <div className="section-header">
          <h2><ScrambleText text="FAV_MEDIA.DAT" /></h2>
          <p className="section-desc">the media I enjoy — a shortcut to understanding me</p>
        </div>

        {/* Gallery chrome: the per-section "temperature" — this room is a wall of
            framed prints, not a database dump. */}
        <div className="gallery-bar">
          <span className="gallery-bar__cmd"><span className="gallery-bar__prompt">srihith@sj.sys:~$</span> open gallery.app</span>
          <span className="gallery-bar__count">{collection.length} plates · est. one human</span>
        </div>

        <div className="media-grid">
          {collection.map((category, i) => (
            <Reveal key={category.key} delay={i * 0.06}>
              <figure className="media-plate" data-category={category.key}>
                <div className="media-plate__art">
                  <img src={category.art} alt="" aria-hidden="true" />
                </div>
                <figcaption className="media-plate__placard">
                  <h3><span className="accent-slash">//</span> {category.label}</h3>
                  <span className="media-plate__count">
                    {category.items.length} {category.items.length === 1 ? 'entry' : 'entries'}
                  </span>
                </figcaption>
                <ul>
                  {category.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </figure>
            </Reveal>
          ))}
        </div>

        {/* ── The live wall ──────────────────────────────────────
            Same frames, different provenance: these plates are wired to
            accounts rather than chosen. */}
        <div className="gallery-bar gallery-bar--live">
          <span className="gallery-bar__cmd">
            <span className="gallery-bar__prompt">srihith@sj.sys:~$</span> open gallery.app --wired
          </span>
          <span className="gallery-bar__count">
            {playlists.length} playlists{films.length > 0 && ` · ${films.length} rated films`}
          </span>
        </div>

        <div className="media-grid media-grid--live">
          {playlists.map((playlist, i) => (
            <Reveal key={playlist.id} delay={i * 0.06}>
              <figure className="media-plate media-plate--embed">
                <div className="media-plate__embed">
                  <iframe
                    src={`https://open.spotify.com/embed/playlist/${playlist.id}?utm_source=generator`}
                    title={`Spotify playlist: ${playlist.label}`}
                    width="100%"
                    height="352"
                    style={{ border: 0 }}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                </div>
                <figcaption className="media-plate__placard">
                  <h3><span className="accent-slash">//</span> {playlist.label}</h3>
                  <span className="media-plate__count">playlist</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}

          {/* Rendered from ratings, not watch dates: the feed holds a handful of
              logs spread over years, and calling that "recently watched" would
              claim a freshness the account does not have. Baked at build time —
              see scripts/letterboxdPlugin.ts. */}
          {films.length > 0 && (
            <Reveal delay={playlists.length * 0.06}>
              <figure className="media-plate media-plate--rated">
                <figcaption className="media-plate__placard">
                  <h3><span className="accent-slash">//</span> RATED ON LETTERBOXD</h3>
                  <span className="media-plate__count">
                    {films.length} {films.length === 1 ? 'film' : 'films'}
                  </span>
                </figcaption>
                <ul className="media-ratings">
                  {films.map((film) => (
                    <li key={film.link}>
                      <a href={film.link} target="_blank" rel="noreferrer">
                        {film.poster && (
                          <img className="media-ratings__poster" src={film.poster} alt="" aria-hidden="true" loading="lazy" />
                        )}
                        <span className="media-ratings__text">
                          <span className="media-ratings__title">
                            {film.title} <span className="media-ratings__year">{film.year}</span>
                          </span>
                          <span className="media-ratings__stars">
                            {film.stars}
                            <span className="sr-only"> — {film.rating} out of 5</span>
                            {film.liked && <span className="media-ratings__like" title="liked">♥</span>}
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
                <a
                  className="media-plate__source"
                  href="https://letterboxd.com/solder/"
                  target="_blank"
                  rel="noreferrer"
                >
                  [ALL ON LETTERBOXD ↗]
                </a>
              </figure>
            </Reveal>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
