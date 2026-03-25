import PageTransition from '../components/PageTransition';
import './Media.css';

const mediaData = {
  music: ['Daft Punk - Discovery', 'Kendrick Lamar - TPAB', 'PinkPantheress - heaven knows', 'Aphex Twin - Selected Ambient Works'],
  films: ['The Matrix (1999)', 'Chungking Express (1994)', 'Spider-Man: Into the Spider-Verse', 'Fight Club (1999)'],
  tv: ['The Sopranos', 'Succession', 'Severance', 'Neon Genesis Evangelion'],
  games: ['Hades', 'Persona 5 Royal', 'Disco Elysium', 'Bloodborne']
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
