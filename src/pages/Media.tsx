import PageTransition from '../components/PageTransition';
import './Media.css';

const mediaData = {
  books: ['East of Eden - John Steinbeck', 'Martin Dressler: The Tale of an American Dreamer - Steven Millhauser', 'Song of Solomon - Toni Morrison', 'Stoner - John Williams', 'The Crucible - Arthur Miller'],
  poetry: ['Ariel - Sylvia Plath', 'Night Sky With Exit Wounds - Ocean Vuong', 'Serious Concerns - Wendy Cope'],
  albums: ['beerbongs & bentleys - Post Malone', 'songs - Adrienne Lenker', 'Live on Red Barn Radio I & II - Tyler Childers', 'Around Fur - Deftones'],
  songs: ['SICKO MODE - Travis Scott ft. Drake', 'Rattlesnake - Jack Van Cleaf ft. Zach Bryan', 'Run Away With Me - Carly Rae Jepsen', 'NOT FAIR - The Kid LAROI ft. Corbin', 'Fast Car - Tracy Chapman'],
  films: ['Catch Me If You Can (2002)', '10 Things I Hate About You (1999)', 'Star Wars: Episode III - Revenge of the Sith (2005)', 'Fantastic Mr. Fox (2009)'],
  tv: ['Suits', 'Henry Danger', 'Mindhunter', 'South Park'],
  games: ['Minecraft', 'Fallout: New Vegas', 'Halo 3', 'Stardew Valley'],
  other: ['Shareholder Letters - Warren Buffett', 'neal.fun', 'The Yellow Wallpaper - Charlotte Perkins Gilman']
};

export default function Media() {
  return (
    <PageTransition>
      <section className="section">
        <div className="section-header">
          <h2>FAV_MEDIA.DAT</h2>
        </div>
        <div className="media-grid">
          {Object.entries(mediaData).map(([category, items]) => (
            <div key={category} className="media-category">
              <h3><span className="accent-slash">//</span> {category.toUpperCase()}</h3>
              <ul>
                {items.map((item, idx) => (
                  <li key={idx}>[ {item} ]</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
