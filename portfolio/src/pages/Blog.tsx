import PageTransition from '../components/PageTransition';

export default function Blog() {
  return (
    <PageTransition>
      <section className="section">
        <div className="section-header">
          <h2>TRANSMISSIONS</h2>
        </div>
        <div style={{ marginTop: '3rem', maxWidth: '800px' }}>
          {[
            { date: '2026-03-25', title: 'Embracing Brutalist Design in Modern Web', abstract: 'Why I chose to abandon Tailwind for this iteration of my portfolio. The importance of structure over polish in a landscape of identical SaaS sites.' },
            { date: '2026-02-14', title: 'My First Year at Rotman Commerce', abstract: 'Reflections on the intersection of business intelligence and digital product creation, and what traditional finance misses about tech.' },
          ].map((post, i) => (
            <article key={i} style={{ borderBottom: '1px solid rgba(240,244,248,0.1)', paddingBottom: '2.5rem', marginBottom: '2.5rem', position: 'relative' }}>
              <span style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontSize: '13px', display: 'block', marginBottom: '1rem' }}>[{post.date}]</span>
              <h3 style={{ fontSize: '2rem', margin: '0 0 1rem 0', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{post.title}</h3>
              <p style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'rgba(240,244,248,0.8)', lineHeight: '1.6' }}>{post.abstract}</p>
              <a href="#" style={{ display: 'inline-block', marginTop: '1.5rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 'bold', borderBottom: '1px solid rgba(0,229,255,0.4)', paddingBottom: '4px', transition: 'all 0.15s ease' }}
                 onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                 onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}>
                 [READ_FULL_TRANSMISSION →]
              </a>
            </article>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
