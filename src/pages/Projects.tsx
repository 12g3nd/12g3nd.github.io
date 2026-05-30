import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import ScrambleText from '../components/ScrambleText';
import useDocumentMeta from '../hooks/useDocumentMeta';

export default function Projects() {
  useDocumentMeta(
    'Projects // Srihith Jarabana',
    'Things Srihith Jarabana has built — from KRINE to a viral Snapchat lens.'
  );
  return (
    <PageTransition>
      <section className="section">
        <div className="section-header">
          <h2><ScrambleText text="PROJECTS_" /></h2>
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
              repo: 'https://github.com/12g3nd/Krine',
              repoLinkText: '[VIEW REPO ↗]',
              logo: '/KrineLogo.jfif'
            },
            {
              id: '02',
              name: 'PlotON',
              description: "A project I've been thinking about since Grade 8. Explore cities across Ontario on an interactive map, weight what matters to you, and compare them side by side to find your next place to live. Still a work in progress, so the data is incomplete for now.",
              stack: ['Next.js', 'leaflet', 'vercel'],
              link: 'https://ploton-zeta.vercel.app/',
              linkText: '[VISIT LIVE ↗]',
              repo: 'https://github.com/12g3nd/PlotON',
              repoLinkText: '[VIEW REPO ↗]',
              logo: '/PlotONPreview.png'
            },
            {
              id: '03',
              name: 'CSB195',
              description: 'Code and data for CSB195 Computational Biology Foundations, University of Toronto',
              stack: ['Jupyter', 'Quarto', 'R'],
              link: 'https://github.com/12g3nd/CSB195',
              linkText: '[VIEW REPO ↗]'
            },
            {
              id: '04',
              name: 'VOTE SRIHITH SNAPCHAT FILTER',
              description: "Something I did a few years ago for whenever I ran for a position and wanted an easy way for people to share my campaign on social media. Went viral somewhere else in the world and it has 198k lens plays (accurate as of 4.6.26). Thought it was funny and creative.\n\n(Note: The person in the image is not me.)",
              stack: ['Snapchat Lens Studio', 'AR', 'Social Media'],
              link: 'https://www.snapchat.com/lens/5f0f516178844f8a8980e5abb0d93ad0',
              linkText: '[VIEW LENS ↗]',
              logo: '/filter.png'
            }
          ].map((project, i) => (
            <Reveal key={i} delay={i * 0.08}>
            <div style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid rgba(253, 246, 227,0.15)', padding: '2rem', transition: 'all 0.15s ease', display: 'flex', flexDirection: 'column', height: '100%' }}
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
              <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <a href={project.link} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', border: '1px solid rgba(0,229,255,0.6)', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontSize: '14px', textTransform: 'uppercase', fontWeight: 'bold', transition: 'all 0.15s ease' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(0,229,255,0.1)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(0,229,255,0.6)'; }}>
                  {project.linkText}
                </a>
                {project.repo && (
                  <a href={project.repo} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', border: '1px solid rgba(0,229,255,0.6)', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontSize: '14px', textTransform: 'uppercase', fontWeight: 'bold', transition: 'all 0.15s ease' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(0,229,255,0.1)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(0,229,255,0.6)'; }}>
                  {project.repoLinkText}
                  </a>
                )}
              </div>
            </div>
            </Reveal>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
