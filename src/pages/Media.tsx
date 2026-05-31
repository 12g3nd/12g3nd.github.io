import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import ScrambleText from '../components/ScrambleText';
import useDocumentMeta from '../hooks/useDocumentMeta';
import './Media.css';

const mediaData: Record<string, string[]> = {
  books: ['East of Eden - John Steinbeck', 'Martin Dressler: The Tale of an American Dreamer - Steven Millhauser', 'Song of Solomon - Toni Morrison', 'Stoner - John Williams', 'The Crucible - Arthur Miller'],
  poetry: ['Ariel - Sylvia Plath', 'Night Sky With Exit Wounds - Ocean Vuong', 'Serious Concerns - Wendy Cope'],
  albums: ['beerbongs & bentleys - Post Malone', 'songs - Adrienne Lenker', 'Live on Red Barn Radio I & II - Tyler Childers', 'Around Fur - Deftones'],
  songs: ['SICKO MODE - Travis Scott ft. Drake', 'Rattlesnake - Jack Van Cleaf ft. Zach Bryan', 'Run Away With Me - Carly Rae Jepsen', 'NOT FAIR - The Kid LAROI ft. Corbin', 'Fast Car - Tracy Chapman'],
  films: ['Catch Me If You Can (2002)', '10 Things I Hate About You (1999)', 'Star Wars: Episode III - Revenge of the Sith (2005)', 'Fantastic Mr. Fox (2009)'],
  tv: ['Suits', 'Henry Danger', 'Mindhunter', 'South Park'],
  games: ['Minecraft', 'Fallout: New Vegas', 'Halo 3', 'Stardew Valley'],
  other: ['Shareholder Letters - Warren Buffett', 'neal.fun', 'The Yellow Wallpaper - Charlotte Perkins Gilman', 'The Ones Who Walk Away from Omelas - Ursula K. Le Guin']
};

const categoryImages: Record<string, string> = {
  books: '/Media/Books.png',
  poetry: '/Media/Poetry.png',
  albums: '/Media/Albums.png',
  songs: '/Media/Songs.png',
  films: '/Media/Films.png',
  tv: '/Media/TV.png',
  games: '/Media/Games.png',
  other: '/Media/Other.png',
};

export default function Media() {
  useDocumentMeta(
    'Media // Srihith Jarabana',
    'Books, poetry, albums, films, and games Srihith Jarabana enjoys.'
  );
  const categories = Object.entries(mediaData);
  return (
    <PageTransition>
      <section className="section">
        <div className="section-header">
          <h2><ScrambleText text="FAV_MEDIA.DAT" /></h2>
          <p className="section-desc">media that I enjoy to help you understand me</p>
        </div>

        {/* Gallery chrome: the per-section "temperature" — this room is a wall of
            framed prints, not a database dump. */}
        <div className="gallery-bar">
          <span className="gallery-bar__cmd"><span className="gallery-bar__prompt">srihith@sj.sys:~$</span> open gallery.app</span>
          <span className="gallery-bar__count">{categories.length} plates · est. one human</span>
        </div>

        <div className="media-grid">
          {categories.map(([category, items], i) => (
            <Reveal key={category} delay={i * 0.06}>
              <figure className="media-plate" data-category={category}>
                <div className="media-plate__art">
                  <img
                    src={categoryImages[category]}
                    alt=""
                    aria-hidden="true"
                  />
                </div>
                <figcaption className="media-plate__placard">
                  <h3><span className="accent-slash">//</span> {category.toUpperCase()}</h3>
                  <span className="media-plate__count">{items.length} {items.length === 1 ? 'entry' : 'entries'}</span>
                </figcaption>
                <ul>
                  {items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
