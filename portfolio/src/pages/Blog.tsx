import PageTransition from '../components/PageTransition';
import { Link } from 'react-router-dom';

export default function Blog() {
  return (
    <PageTransition>
      <section className="section">
        <div className="section-header">
          <h2>TRANSMISSIONS</h2>
        </div>
        <div style={{ marginTop: '3rem', maxWidth: '800px' }}>
          {[
            { 
              date: '2026-03-26', 
              title: 'Embracing Brutalist X Y2K Aesthetics in Web Design', 
              abstract: 'Why I chose to abandon Tailwind for this iteration of my portfolio. The importance of structure over polish in a landscape of identical SaaS sites.',
              link: '/blog/brutalist-y2k'
            },
          ].map((post, i) => (
            <article key={i} style={{ borderBottom: '1px solid rgba(253, 246, 227,0.1)', paddingBottom: '2.5rem', marginBottom: '2.5rem', position: 'relative' }}>
              <span style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontSize: '13px', display: 'block', marginBottom: '1rem' }}>[{post.date}]</span>
              <h3 style={{ fontSize: '2rem', margin: '0 0 1rem 0', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{post.title}</h3>
              <p style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'rgba(253, 246, 227,0.8)', lineHeight: '1.6' }}>{post.abstract}</p>
              <Link to={post.link} style={{ display: 'inline-block', marginTop: '1.5rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 'bold', borderBottom: '1px solid rgba(0,229,255,0.4)', paddingBottom: '4px', transition: 'all 0.15s ease', textDecoration: 'none' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}>
                [READ_FULL_TRANSMISSION →]
              </Link>
            </article>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
