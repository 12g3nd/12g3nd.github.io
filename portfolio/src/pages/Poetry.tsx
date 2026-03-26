import PageTransition from '../components/PageTransition';

export default function Poetry() {
  return (
    <PageTransition>
      <section className="section">
        <div className="section-header">
          <h2>POETRY_</h2>
        </div>
        <div style={{ marginTop: '3rem', maxWidth: '800px' }}>
          {[
            { 
              date: '2026-03-25', 
              title: 'SILICON SILENCE', 
              lines: [
                'A quiet hum in the server room,',
                'Data flowing like a digital bloom.',
                'Lines of code form a rigid spine,',
                'Structured logic perfectly aligned.'
              ] 
            },
          ].map((poem, i) => (
            <article key={i} style={{ borderBottom: '1px solid rgba(240,244,248,0.1)', paddingBottom: '2.5rem', marginBottom: '2.5rem', position: 'relative' }}>
              <span style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontSize: '13px', display: 'block', marginBottom: '1rem' }}>[{poem.date}]</span>
              <h3 style={{ fontSize: '2rem', margin: '0 0 1rem 0', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{poem.title}</h3>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'rgba(240,244,248,0.8)', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                {poem.lines.join('\n')}
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
