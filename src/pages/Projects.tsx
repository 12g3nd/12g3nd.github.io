import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import ScrambleText from '../components/ScrambleText';
import useDocumentMeta from '../hooks/useDocumentMeta';
import './Projects.css';

type Project = {
  id: string;
  name: string;
  description: string;
  stack: string[];
  link?: string;
  linkText?: string;
  repo?: string;
  repoLinkText?: string;
  /* optional third link (e.g. a Devpost / awards page) */
  devpost?: string;
  logo?: string;
  /* status chip — LIVE / VIRAL / WIP / REPO / ARCHIVE / AWARD */
  status?: string;
  /* richer chip label (emoji / multi-word); falls back to `● {status}` */
  statusLabel?: string;
  /* headline number, pulled out big so the work reads at a glance */
  metric?: { value: string; label: string; note?: string };
  /* featured projects render full-width at the top of the grid */
  featured?: boolean;
  /* spans two grid columns for extra emphasis */
  wide?: boolean;
  /* spans two grid rows for vertical emphasis */
  tall?: boolean;
  /* forces the card to begin a fresh grid row */
  startRow?: boolean;
};

const projects: Project[] = [
  {
    id: '01',
    name: 'KRINE',
    description: 'Founded and solely developed a digital platform for anonymous messages. Managed end-to-end technical stack and community guidelines. Highly focused on allowing open, high-fidelity conversations within a moderated environment.',
    stack: ['Python', 'Django', 'PostgreSQL', 'Redis', 'Hugging Face Transformers (AI)', 'Docker', 'Nginx', 'Gunicorn', 'AWS S3', 'Sentry', 'Cloudflare', 'Google Analytics', 'HTML5', 'CSS3', 'JavaScript'],
    link: 'https://krine.ca/',
    linkText: '[VISIT LIVE ↗]',
    repo: 'https://github.com/12g3nd/Krine',
    repoLinkText: '[VIEW REPO ↗]',
    logo: '/KrineLogo.jfif',
    status: 'LIVE',
    metric: { value: '~1.4K', label: 'visitors / month', note: 'as of 6.2.26' },
    featured: true,
  },
  {
    id: '02',
    name: 'Waive',
    description: "Built with Skyler Xiao, Aryan Thakur, and Adam Zaidan. Waive turns an intimidating government notice into a clear path forward before your deadline: upload the letter, get your real deadline and the remedy the law already wrote for you. The hard line: AI only reads and translates, while tested code computes every date, routes the remedy, and cites a real statute, so the model can never invent anything that costs you. Placed 2nd of 52 teams at STEMINATE Hacks 2026.",
    stack: ['Next.js', 'TypeScript', 'Vitest', 'Ollama', 'Tailwind CSS', 'Vercel'],
    link: 'https://waivelegal.vercel.app/',
    linkText: '[VISIT LIVE ↗]',
    repo: 'https://github.com/12g3nd/Waive',
    repoLinkText: '[VIEW REPO ↗]',
    devpost: 'https://devpost.com/software/waive',
    logo: '/Waive.jpg',
    status: 'AWARD',
    statusLabel: '🏆 WINNER',
    metric: { value: '2nd', label: 'of 52 teams', note: 'STEMINATE Hacks 2026 · 281 participants' },
    wide: true,
  },
  {
    id: '03',
    name: 'PlotON',
    description: "A project I've been thinking about since Grade 8. Explore cities across Ontario on an interactive map, weight what matters to you, and compare them side by side to find your next place to live. Still a work in progress, so the data is incomplete for now.",
    stack: ['Next.js', 'Leaflet', 'Vercel'],
    link: 'https://ploton-zeta.vercel.app/',
    linkText: '[VISIT LIVE ↗]',
    repo: 'https://github.com/12g3nd/PlotON',
    repoLinkText: '[VIEW REPO ↗]',
    logo: '/PlotONPreview.png',
    status: 'WIP',
    tall: true,
  },
  {
    id: '04',
    name: 'LinguaScape',
    description: "LinguaScape is a language learning application that helps users practice real-world speaking skills through unscripted, immersive conversations with diverse AI personas.",
    stack: ['React', 'TypeScript'],
    link: 'https://www.jarabana.com/LinguaScape/',
    linkText: '[VISIT LIVE ↗]',
    repo: 'https://github.com/12g3nd/LinguaScape',
    repoLinkText: '[VIEW REPO ↗]',
    logo: '/LinguaPreview.png',
    status: 'LIVE',
  },
  {
    id: '05',
    name: 'The Clearwater Forge',
    description: "A portfolio backtesting application that allows users to evaluate custom stock portfolios against benchmarks while computing advanced statistics like CAGR, Sharpe ratios, and max drawdowns.",
    stack: ['Streamlit', 'React'],
    repo: 'https://github.com/12g3nd/TheClearwaterForge',
    repoLinkText: '[VIEW REPO ↗]',
    status: 'REPO',
  },
  {
    id: '06',
    name: 'drift',
    description: "Drift is a Chrome extension that replaces the standard new tab page with a living, procedurally generated landscape rendered from simple shapes.",
    stack: ['JavaScript', 'HTML'],
    link: 'https://github.com/12g3nd/drift',
    linkText: '[VIEW REPO ↗]',
    logo: '/DriftPreview.png',
    status: 'REPO',
  },
  {
    id: '07',
    name: 'Spring Break Project',
    description: 'A younger me during when I first became a teenager made a website where every Spring Break, I would write some articles. Kind of full circle to this website if you think about. Also, please do not flame me for my corniness back then.',
    stack: ['Google Sites'],
    link: 'https://sites.google.com/view/springbreakproject/',
    linkText: '[VIEW LIVE ↗]',
    logo: '/SBPPreview.png',
    status: 'ARCHIVE',
    startRow: true,
  },
  {
    id: '08',
    name: 'VOTE SRIHITH SNAPCHAT FILTER',
    description: "Something I did a few years ago for whenever I ran for a position and wanted an easy way for people to share my campaign on social media. Went viral somewhere else in the world and it has 198k lens plays (accurate as of 4.6.26). Thought it was funny and creative.\n\n(Note: The person in the image is not me.)",
    stack: ['Snapchat Lens Studio', 'AR', 'Social Media'],
    link: 'https://www.snapchat.com/lens/5f0f516178844f8a8980e5abb0d93ad0',
    linkText: '[VIEW LENS ↗]',
    logo: '/filter.png',
    status: 'VIRAL',
    metric: { value: '198K', label: 'lens plays' },
    wide: true,
  },
];

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
          <p className="section-desc">the second pillar: things I've built (platforms, tools, and experiments)</p>
        </div>

        {/* Package-manager chrome: frames the page as `pkg list` inside SJ.SYS */}
        <div className="pkg-bar">
          <span className="pkg-bar__cmd"><span className="pkg-bar__prompt">srihith@sj.sys:~$</span> pkg list --built</span>
          <span className="pkg-bar__count">{projects.length} packages</span>
        </div>

        <div className="projects-grid">
          {projects.map((project, i) => (
            <Reveal
              key={project.id}
              delay={i * 0.08}
              className={[
                'project-card-wrap',
                project.featured && 'project-card-wrap--featured',
                project.wide && 'project-card-wrap--wide',
                project.startRow && 'project-card-wrap--newrow',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className={`project-card${project.featured ? ' project-card--featured' : ''}`}>
                <span className="project-card__num">{project.id}</span>
                {project.status && (
                  <span className={`project-card__status project-card__status--${project.status.toLowerCase()}`}>
                    {project.statusLabel ?? `● ${project.status}`}
                  </span>
                )}
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
                <div className="project-card__body">
                  <h3 className="project-card__title">
                    <span className="slash">//</span> PROJECT {project.id}: {project.name}
                  </h3>
                  {project.metric && (
                    <div className="project-card__metric">
                      <span className="project-card__metric-value">{project.metric.value}</span>
                      <span className="project-card__metric-label">
                        {project.metric.label}
                        {project.metric.note && (
                          <span className="project-card__metric-note">{project.metric.note}</span>
                        )}
                      </span>
                    </div>
                  )}
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
                    {project.devpost && (
                      <a href={project.devpost} target="_blank" rel="noreferrer">[DEVPOST ↗]</a>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
