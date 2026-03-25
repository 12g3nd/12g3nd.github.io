import PageTransition from '../components/PageTransition';

export default function Projects() {
  return (
    <PageTransition>
      <section className="section">
        <div className="section-header">
          <h2>PROJECTS_</h2>
        </div>
        <div style={{ marginTop: '2rem', display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid rgba(240,244,248,0.15)', padding: '2rem', transition: 'all 0.15s ease' }} 
                 onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.6)'; }}
                 onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(240,244,248,0.15)'; }}>
              <h3 style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}><span style={{ color: 'var(--accent-primary)' }}>//</span> PROJECT 0{i}</h3>
              <p style={{ marginTop: '1rem', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(240,244,248,0.8)', lineHeight: '1.6' }}>
                Brutalist description of the project and its impact. Connecting business value with clean architecture.
              </p>
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                <span style={{ border: '1px solid rgba(240,244,248,0.2)', color: 'rgba(240,244,248,0.8)', padding: '0.2rem 0.5rem', fontSize: '12px', fontFamily: 'var(--font-mono)', borderRadius: '999px' }}>React</span>
                <span style={{ border: '1px solid rgba(240,244,248,0.2)', color: 'rgba(240,244,248,0.8)', padding: '0.2rem 0.5rem', fontSize: '12px', fontFamily: 'var(--font-mono)', borderRadius: '999px' }}>Node.js</span>
              </div>
              <a href="#" style={{ display: 'inline-block', marginTop: '2rem', padding: '0.75rem 1.5rem', border: '1px solid rgba(0,229,255,0.6)', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontSize: '14px', textTransform: 'uppercase', fontWeight: 'bold', transition: 'all 0.15s ease' }}
                 onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(0,229,255,0.1)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                 onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(0,229,255,0.6)'; }}>
                 [VIEW REPO ↗]
              </a>
            </div>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
