import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import ScrambleText from '../components/ScrambleText';
import useDocumentMeta from '../hooks/useDocumentMeta';
import './Projects.css';

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
        <div className="projects-grid">
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
              name: 'Lingua',
              description: "Lingua is a language learning application that helps users practice real-world speaking skills through unscripted, immersive conversations with diverse AI personas.",
              stack: ['React', 'TypeScript'],
              repo: 'https://github.com/12g3nd/Lingua',
              repoLinkText: '[VIEW REPO ↗]',
              logo: '/LinguaPreview.png'
            },
            {
              id: '04',
              name: 'The Clearwater Forge',
              description: "A portfolio backtesting application that allows users to evaluate custom stock portfolios against benchmarks while computing advanced statistics like CAGR, Sharpe ratios, and max drawdowns.",
              stack: ['Streamlit', 'React'],
              repo: 'https://github.com/12g3nd/TheClearwaterForge',
              repoLinkText: '[VIEW REPO ↗]'
            },
            {
              id: '05',
              name: 'drift',
              description: "Drift is a Chrome extension that replaces the standard new tab page with a living, procedurally generated landscape rendered from simple shapes.",
              stack: ['JavaScript', 'HTML'],
              link: 'https://github.com/12g3nd/drift',
              linkText: '[VIEW REPO ↗]'
            },
            {
              id: '06',
              name: 'CSB195',
              description: 'Code and data for CSB195 Computational Biology Foundations, University of Toronto',
              stack: ['Jupyter', 'Quarto', 'R'],
              link: 'https://github.com/12g3nd/CSB195',
              linkText: '[VIEW REPO ↗]'
            },
            {
              id: '07',
              name: 'VOTE SRIHITH SNAPCHAT FILTER',
              description: "Something I did a few years ago for whenever I ran for a position and wanted an easy way for people to share my campaign on social media. Went viral somewhere else in the world and it has 198k lens plays (accurate as of 4.6.26). Thought it was funny and creative.\n\n(Note: The person in the image is not me.)",
              stack: ['Snapchat Lens Studio', 'AR', 'Social Media'],
              link: 'https://www.snapchat.com/lens/5f0f516178844f8a8980e5abb0d93ad0',
              linkText: '[VIEW LENS ↗]',
              logo: '/filter.png'
            }
          ].map((project, i) => (
            <Reveal key={i} delay={i * 0.08} className="project-card-wrap">
            <div className="project-card">
              <span className="project-card__num">{project.id}</span>
              {project.logo ? (
                <div className="project-card__preview">
                  <img src={project.logo} alt={`${project.name} preview`} />
                </div>
              ) : (
                <div className="project-card__preview project-card__preview--placeholder">
                  <span className="ph-name">{project.name}</span>
                  <span className="ph-tag">{project.stack[0]}</span>
                </div>
              )}
              <h3 className="project-card__title">
                <span className="slash">//</span> PROJECT {project.id}: {project.name}
              </h3>
              <p className="project-card__desc">{project.description}</p>
              <div className="project-card__stack">
                {project.stack.map((tech, j) => (
                  <span key={j}>{tech}</span>
                ))}
              </div>
              <div className="project-card__links">
                {project.link && (
                  <a href={project.link} target="_blank" rel="noreferrer">{project.linkText}</a>
                )}
                {project.repo && (
                  <a href={project.repo} target="_blank" rel="noreferrer">{project.repoLinkText}</a>
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
