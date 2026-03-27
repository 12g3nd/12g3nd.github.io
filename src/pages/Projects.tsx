import PageTransition from '../components/PageTransition';

export default function Projects() {
  return (
    <PageTransition>
      <section className="section">
        <div className="section-header">
          <h2>PROJECTS_</h2>
        </div>
        <div style={{ marginTop: '2rem', display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', alignItems: 'start' }}>
          {[
            {
              id: '01',
              name: 'KRINE',
              description: 'Founded and solely developed a digital platform for anonymous messages. Managed end-to-end technical stack and community guidelines. Highly focused on allowing open, high-fidelity conversations within a moderated environment.',
              stack: ['Python', 'Django', 'PostgreSQL', 'Redis', 'Hugging Face Transformers (AI)', 'Docker', 'Nginx', 'Gunicorn', 'AWS S3', 'Sentry', 'Cloudflare', 'Google Analytics', 'HTML5', 'CSS3', 'JavaScript'],
              link: 'https://krine.ca/',
              linkText: '[VISIT LIVE ↗]',
              logo: '/KrineLogo.jfif'
            },
            {
              id: '02',
              name: 'CSB195',
              description: 'Code and data for CSB195 Computational Biology Foundations, University of Toronto',
              stack: ['Jupyter', 'Quarto', 'R'],
              link: 'https://github.com/12g3nd/CSB195',
              linkText: '[VIEW REPO ↗]'
            }
          ].map((project, i) => (
            <div key={i} style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid rgba(253, 246, 227,0.15)', padding: '2rem', transition: 'all 0.15s ease', display: 'flex', flexDirection: 'column' }} 
                 onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.6)'; }}
                 onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(253, 246, 227,0.15)'; }}>
              {project.logo && (
                <div style={{ marginBottom: '1.5rem', width: '100%', height: '140px', backgroundColor: '#fff', border: '2px solid rgba(0,229,255,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <img src={project.logo} alt={`${project.name} logo`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              )}
              <h3 style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}><span style={{ color: 'var(--accent-primary)' }}>//</span> PROJECT {project.id}: {project.name}</h3>
              <p style={{ marginTop: '1rem', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(253, 246, 227,0.8)', lineHeight: '1.6', flexGrow: 1 }}>
                {project.description}
              </p>
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {project.stack.map((tech, j) => (
                  <span key={j} style={{ border: '1px solid rgba(253, 246, 227,0.2)', color: 'rgba(253, 246, 227,0.8)', padding: '0.2rem 0.5rem', fontSize: '12px', fontFamily: 'var(--font-mono)', borderRadius: '999px' }}>
                    {tech}
                  </span>
                ))}
              </div>
              <a href={project.link} target="_blank" rel="noreferrer" style={{ display: 'inline-block', alignSelf: 'flex-start', marginTop: '2rem', padding: '0.75rem 1.5rem', border: '1px solid rgba(0,229,255,0.6)', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontSize: '14px', textTransform: 'uppercase', fontWeight: 'bold', transition: 'all 0.15s ease' }}
                 onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(0,229,255,0.1)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                 onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(0,229,255,0.6)'; }}>
                 {project.linkText}
              </a>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '4rem', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'rgba(253, 246, 227, 0.4)', fontSize: '14px', letterSpacing: '0.1em' }}>
          MORE COMING SOON...
        </div>
      </section>
    </PageTransition>
  );
}
