import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import ScrambleText from '../components/ScrambleText';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { routeMeta } from '../data/routeMeta';
import './projects/index.css';

/* A link is a {href, text} pair rather than the old parallel
   link/linkText/repo/repoLinkText/devpost fields: several cards now carry three
   destinations (a live app plus two repos), and a fixed set of slots can't hold
   a fourth without inventing another field name. */
type Link = {
  href: string;
  text: string;
};

type Metric = {
  value: string;
  label: string;
  note?: string;
};

/* Projects shipped under the FI99 studio, rendered as a tier inside the FI99
   card rather than as siblings in the main grid. They keep fi99.ca's own status
   vocabulary (SHIPPED / IN THE LAB / PAUSED) instead of being translated into
   this site's — the studio is its own system, and a child tier that talks
   differently is easier to read than one that only looks different. */
type Child = {
  name: string;
  description: string;
  stack: string[];
  status: 'SHIPPED' | 'IN THE LAB' | 'PAUSED';
  links: Link[];
  logo?: string;
  metric?: Metric;
  /* Rendered as a byline when the work isn't solely mine. */
  credit?: string;
};

/* The page reads as four shelves rather than one undifferentiated grid. A
   visitor who only looks at the first shelf should still have seen the work
   worth judging me on; a visitor who reaches the last one should know they are
   looking at retired work on purpose. */
const SECTIONS = [
  {
    key: 'selected',
    label: 'SELECTED WORK',
    blurb: 'the ones I would show you first',
  },
  {
    key: 'studio',
    label: 'STUDIO WORK',
    blurb: 'everything shipping under FI99 Inc.',
  },
  {
    key: 'tools',
    label: 'SMALL TOOLS / EXPERIMENTS',
    blurb: 'the rest of what I have built and kept running',
  },
  {
    key: 'archive',
    label: 'ARCHIVE',
    blurb: 'finished work, left standing exactly as it was',
  },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

type Project = {
  /* Stable React key. The number a card displays is derived from its position
     in the rendered order, so reordering the page can't leave two cards
     claiming 03. */
  key: string;
  /* Which shelf this sits on. Order within a section follows array order. */
  section: SectionKey;
  name: string;
  description: string;
  stack: string[];
  links: Link[];
  logo?: string;
  /* status chip — LIVE / VIRAL / WIP / REPO / ARCHIVE / AWARD / STUDIO */
  status?: string;
  /* richer chip label (emoji / multi-word); falls back to `● {status}` */
  statusLabel?: string;
  /* headline number, pulled out big so the work reads at a glance */
  metric?: Metric;
  /* Byline for work that isn't solely mine, ships under the studio, or needs
     its provenance stated. */
  credit?: string;
  /* featured projects render full-width at the top of the grid */
  featured?: boolean;
  /* spans two grid columns for extra emphasis */
  wide?: boolean;
  /* forces the card to begin a fresh grid row */
  startRow?: boolean;
  children?: Child[];
};

const projects: Project[] = [
  {
    key: 'fi99',
    section: 'studio',
    name: 'FI99 Inc.',
    description:
      "Co-founded an incorporated studio with Omar Badawy and Lars Fransen-Molino, and built fi99.ca end-to-end: a real-time Three.js/WebGL rocket centrepiece converted from a raw OBJ into an optimised wireframe GLB, with cursor-tracking, scroll-driven motion, and particle systems. Four projects ship under the studio: PlotON and VERDANT lead this page above, and the rest are listed below. Omar and Lars ship their own work there too — Watt's Left and the Junior Mining Analyst Workbench are theirs, not mine.",
    stack: ['Astro', 'TypeScript', 'Three.js (WebGL)', 'Tailwind CSS', 'GSAP', 'Lenis'],
    links: [
      { href: 'https://fi99.ca', text: '[VISIT LIVE ↗]' },
      { href: 'https://fi99.ca/team/', text: '[THE TEAM ↗]' },
      { href: 'https://github.com/FI99-Inc', text: '[VIEW ORG ↗]' },
    ],
    logo: '/projects/fi99.jpg',
    status: 'STUDIO',
    statusLabel: '◆ STUDIO',
    metric: { value: '4', label: 'projects shipped under it', note: 'incorporated Jul 2026' },
    featured: true,
    children: [
      {
        name: 'Fallow',
        description:
          "Thirteen questions about how your brain actually works — not about what you already like — and Fallow matches you to five activities you'd never have thought to search for. An advanced hobby finder for the bored and bold.",
        stack: ['JavaScript', 'Python', 'PostgreSQL'],
        status: 'IN THE LAB',
        links: [
          { href: 'https://fallow.fi99.ca', text: '[LIVE ↗]' },
          { href: 'https://github.com/FI99-Inc/fallow', text: '[REPO ↗]' },
        ],
        logo: '/projects/fallow.jpg',
      },
      {
        name: 'WR!TE',
        description:
          'A local-first editor for poems and short stories with the craft tools built in: live syllable counts, scansion against a target meter, rhyme-scheme detection, form templates, and version snapshots. The CMU pronouncing dictionary ships with the app, everything lives in IndexedDB, and nothing is sent anywhere.',
        stack: ['TypeScript', 'IndexedDB', 'CMU Dict', 'Offline-first'],
        status: 'SHIPPED',
        links: [
          { href: 'https://write.fi99.ca', text: '[LIVE ↗]' },
          { href: 'https://github.com/FI99-Inc/write', text: '[REPO ↗]' },
        ],
        logo: '/projects/write.jpg',
      },
    ],
  },
  {
    key: 'waive',
    section: 'selected',
    name: 'Waive',
    description:
      "Built with Skyler Xiao, Aryan Thakur, and Adam Zaidan. Waive turns an intimidating government notice into a clear path forward before your deadline: upload the letter, get your real deadline and the remedy the law already wrote for you. The hard line: AI only reads and translates, while tested code computes every date, routes the remedy, and cites a real statute, so the model can never invent anything that costs you. Placed 2nd of 52 teams at STEMINATE Hacks 2026.",
    stack: ['Next.js', 'TypeScript', 'Vitest', 'Ollama', 'Tailwind CSS', 'Vercel'],
    links: [
      { href: 'https://waivelegal.vercel.app/', text: '[VISIT LIVE ↗]' },
      { href: 'https://github.com/12g3nd/Waive', text: '[VIEW REPO ↗]' },
      { href: 'https://devpost.com/software/waive', text: '[DEVPOST ↗]' },
    ],
    logo: '/Waive.jpg',
    status: 'AWARD',
    statusLabel: '🏆 AWARD',
    metric: { value: '2nd', label: 'of 52 teams', note: 'STEMINATE Hacks 2026 · 281 participants' },
  },
  {
    key: 'verdant',
    section: 'selected',
    name: 'VERDANT',
    description:
      'A falsifiable recommendation engine for sparse, subjective preferences, grown out of a problem we hit in Fallow. v0.8 completed its preregistered confirmation experiment: cardinal scoring beat the historical formulation across all eleven simulated worlds, but the full policy failed six of the eleven confirmation screens, and the held-out audit was deliberately not run. Paused rather than quietly shipped — a system that cannot reject itself is not much of an experiment.',
    stack: ['Recommender Systems', 'Preregistration', 'Simulation'],
    links: [{ href: 'https://fi99.ca/research/verdant/', text: '[READ THE RESEARCH ↗]' }],
    logo: '/projects/verdant.jpg',
    status: 'PAUSED',
    credit: 'shipped under FI99 Inc.',
    metric: { value: '5 / 11', label: 'confirmation screens passed', note: 'audit withheld · paused after v0.8' },
  },
  {
    key: 'ploton',
    section: 'selected',
    name: 'PlotON',
    description:
      "A project I'd been thinking about since Grade 8. Explore cities across Ontario on an interactive map, weight what matters to you, and compare them side by side to find your next place to live. Data is still incomplete.",
    stack: ['Next.js', 'Leaflet', 'Vercel'],
    links: [
      { href: 'https://ploton-zeta.vercel.app/', text: '[VISIT LIVE ↗]' },
      { href: 'https://github.com/12g3nd/PlotON', text: '[VIEW REPO ↗]' },
    ],
    logo: '/PlotONPreview.png',
    status: 'IN THE LAB',
    credit: 'shipped under FI99 Inc. · with Omar Badawy',
  },
  {
    key: 'courtiq',
    section: 'tools',
    name: 'CourtIQ',
    description:
      'Built with Skyler Xiao, Aryan Thakur, and Adam Zaidan. CourtIQ imports your Sleeper NBA league and re-scores it under a different rulebook — the same player can sit 69th in a category league and 5th in a points league, and CourtIQ shows you the free-throw volume and percentage drag that explain why.',
    stack: ['TypeScript', 'Next.js', 'Sleeper API', 'Vercel'],
    links: [
      { href: 'https://fantasy-agent-kappa.vercel.app', text: '[VISIT LIVE ↗]' },
      { href: 'https://github.com/skiller99668/FantasyAgent', text: '[SOURCE REPO ↗]' },
      { href: 'https://github.com/12g3nd/CourtIQ', text: '[MY FORK ↗]' },
    ],
    logo: '/projects/courtiq.jpg',
    status: 'LIVE',
  },
  {
    key: 'linguascape',
    section: 'tools',
    name: 'LinguaScape',
    description:
      'LinguaScape is a language learning application that helps users practice real-world speaking skills through unscripted, immersive conversations with diverse AI personas.',
    stack: ['React', 'TypeScript'],
    links: [
      { href: 'https://www.jarabana.com/LinguaScape/', text: '[VISIT LIVE ↗]' },
      { href: 'https://github.com/12g3nd/LinguaScape', text: '[VIEW REPO ↗]' },
    ],
    logo: '/LinguaPreview.png',
    status: 'LIVE',
  },
  {
    key: 'ai-rule-miner',
    section: 'tools',
    name: 'ai-rule-miner',
    description:
      "Mines your AI chat history — Claude, Codex, Cursor, Windsurf — for the places you corrected the model, scores each correction by recency, and emits a standing rule set or updates an MCP server so the same mistake stops coming back. Ships as two CLIs: the miner and the server.",
    stack: ['Python', 'MCP', 'CLI'],
    links: [{ href: 'https://github.com/12g3nd/ai-rule-miner', text: '[VIEW REPO ↗]' }],
    status: 'REPO',
  },
  {
    key: 'frame-loop',
    section: 'tools',
    name: 'frame-loop',
    description:
      'A Manifest V3 Chrome extension that loops any HTML5 video between two frame-accurate points, not just the whole clip. Built to work where most loopers give up — including players that hide the video element inside a shadow DOM ordinary extensions cannot reach.',
    stack: ['JavaScript', 'Chrome MV3', 'Shadow DOM'],
    links: [{ href: 'https://github.com/12g3nd/frame-loop', text: '[VIEW REPO ↗]' }],
    status: 'REPO',
  },
  {
    key: 'lacquer',
    section: 'tools',
    name: 'lacquer',
    description:
      'A fork of pear-devs/pear-desktop, rebuilt on top of the upstream app as a personal version of Pear tuned to my own machine and theme. The heavy lifting is upstream; what is mine is the layer on top.',
    stack: ['TypeScript', 'JavaScript', 'CSS'],
    links: [
      { href: 'https://github.com/12g3nd/lacquer', text: '[MY FORK ↗]' },
      { href: 'https://github.com/pear-devs/pear-desktop', text: '[UPSTREAM ↗]' },
    ],
    status: 'REPO',
  },
  {
    key: 'clearwater-forge',
    section: 'tools',
    name: 'The Clearwater Forge',
    description:
      'A portfolio backtesting application that allows users to evaluate custom stock portfolios against benchmarks while computing advanced statistics like CAGR, Sharpe ratios, and max drawdowns.',
    stack: ['Streamlit', 'React'],
    links: [{ href: 'https://github.com/12g3nd/TheClearwaterForge', text: '[VIEW REPO ↗]' }],
    status: 'REPO',
  },
  {
    key: 'drift',
    section: 'tools',
    name: 'drift',
    description:
      'Drift is a Chrome extension that replaces the standard new tab page with a living, procedurally generated landscape rendered from simple shapes.',
    stack: ['JavaScript', 'HTML'],
    links: [{ href: 'https://github.com/12g3nd/drift', text: '[VIEW REPO ↗]' }],
    logo: '/DriftPreview.png',
    status: 'REPO',
  },
  {
    key: 'krine',
    section: 'archive',
    name: 'Krine',
    description:
      'Founded and solely developed a digital platform for anonymous messages — end-to-end technical stack and community guidelines. Krine is now permanently retired as Krine / Closed Network; krine.ca remains online as a read-only static archive with no accounts, posting, likes, reports, or new comments.',
    stack: ['Python', 'Django', 'PostgreSQL', 'Redis', 'Hugging Face', 'Docker', 'AWS S3'],
    links: [
      { href: 'https://krine.ca/', text: '[READ-ONLY SITE ↗]' },
      { href: 'https://github.com/12g3nd/Krine', text: '[REPO ↗]' },
    ],
    logo: '/KrineLogo.jfif',
    status: 'ARCHIVE',
    statusLabel: '● ARCHIVED',
    credit: 'personal project · independently developed',
    metric: { value: '83', label: 'public entries preserved', note: 'final archive · 9.5.26' },
  },
  {
    key: 'snapchat-filter',
    section: 'archive',
    name: 'VOTE SRIHITH SNAPCHAT FILTER',
    description:
      "Something I did a few years ago for whenever I ran for a position and wanted an easy way for people to share my campaign on social media. Went viral somewhere else in the world and it has 198k lens plays (accurate as of 4.6.26). Thought it was funny and creative.\n\n(Note: The person in the image is not me.)",
    stack: ['Snapchat Lens Studio', 'AR', 'Social Media'],
    links: [{ href: 'https://www.snapchat.com/lens/5f0f516178844f8a8980e5abb0d93ad0', text: '[VIEW LENS ↗]' }],
    logo: '/filter.png',
    status: 'VIRAL',
    metric: { value: '198K', label: 'lens plays' },
    wide: true,
  },
  {
    key: 'spring-break',
    section: 'archive',
    name: 'Spring Break Project',
    description:
      'A younger me during when I first became a teenager made a website where every Spring Break, I would write some articles. Kind of full circle to this website if you think about. Also, please do not flame me for my corniness back then.',
    stack: ['Google Sites'],
    links: [{ href: 'https://sites.google.com/view/springbreakproject/', text: '[VIEW LIVE ↗]' }],
    logo: '/SBPPreview.png',
    status: 'ARCHIVE',
  },
];

/** `01`, `02`, … from a card's position, so the order is the only ordering. */
const num = (i: number) => String(i + 1).padStart(2, '0');

/* Grouped for display, but numbered as one continuous run down the page: the
   shelves are an editorial device, and restarting at 01 under each would make
   `pkg list` read like four unrelated indexes. Numbers are assigned here, once,
   from the rendered order — nothing downstream gets to invent its own. */
const shelves = SECTIONS.map((section) => ({
  ...section,
  items: projects.filter((p) => p.section === section.key),
}));

const numberOf = new Map<string, string>(
  shelves.flatMap((s) => s.items).map((p, i) => [p.key, num(i)])
);

/* The pkg bar counts everything installed, children included — a count that
   only saw top-level cards would quietly start under-reporting the moment the
   studio tier grew. */
const packageCount =
  projects.length + projects.reduce((n, p) => n + (p.children?.length ?? 0), 0);

export default function Projects() {
  useDocumentMeta(routeMeta.projects.title, routeMeta.projects.description);
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
          <span className="pkg-bar__count">{packageCount} packages</span>
        </div>

        {shelves.map((shelf) => (
          <section className="projects-shelf" key={shelf.key}>
            <div className="projects-shelf__head">
              <h3 className="projects-shelf__label">
                <span className="slash">//</span> {shelf.label}
              </h3>
              <span className="projects-shelf__blurb">{shelf.blurb}</span>
            </div>

            <div className="projects-grid">
          {shelf.items.map((project, i) => (
            <Reveal
              key={project.key}
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
                <span className="project-card__num">{numberOf.get(project.key)}</span>
                {project.status && (
                  <span
                    className={`project-card__status project-card__status--${project.status
                      .toLowerCase()
                      .replace(/\s+/g, '-')}`}
                  >
                    {project.statusLabel ?? `● ${project.status}`}
                  </span>
                )}
                {/* The lede is `display: contents` for a normal card and only
                    becomes a flex row on a featured one, so the studio tier
                    below can span the whole card instead of being squeezed
                    into the featured layout's 58% text column. */}
                <div className="project-card__lede">
                {project.logo ? (
                  <div className="project-card__preview">
                    <img src={project.logo} alt={`${project.name} preview`} loading="lazy" />
                  </div>
                ) : (
                  <div className="project-card__preview project-card__preview--placeholder">
                    <span className="ph-name">{project.name}</span>
                    <span className="ph-tag">{project.stack[0]}</span>
                  </div>
                )}
                <div className="project-card__body">
                  <h3 className="project-card__title">
                    <span className="slash">//</span> PROJECT {numberOf.get(project.key)}: {project.name}
                  </h3>
                  {project.credit && <p className="project-card__credit">{project.credit}</p>}
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
                    {project.stack.map((tech) => (
                      <span key={tech}>{tech}</span>
                    ))}
                  </div>
                  <div className="project-card__links">
                    {project.links.map((l) => (
                      <a key={l.href} href={l.href} target="_blank" rel="noreferrer">{l.text}</a>
                    ))}
                  </div>
                </div>{/* /project-card__body */}
                </div>{/* /project-card__lede */}

                {/* ── Studio tier ──────────────────────────────
                    Smaller cards than the grid's own, so the studio's work
                    keeps its screenshots and metrics without competing with
                    the top-level projects for the same visual weight. */}
                {project.children && (
                    <div className="project-children">
                      <div className="project-children__bar">
                        <span className="project-children__cmd">
                          <span className="pkg-bar__prompt">srihith@sj.sys:~$</span> pkg list --studio
                        </span>
                        <span className="project-children__count">
                          {project.children.length} packages
                        </span>
                      </div>
                      <div className="project-children__grid">
                        {project.children.map((child, j) => (
                          <article className="project-child" key={child.name}>
                            <div className="project-child__head">
                              <span className="project-child__num">{numberOf.get(project.key)}.{j + 1}</span>
                              <h4 className="project-child__title">{child.name}</h4>
                              <span
                                className={`project-child__status project-child__status--${child.status
                                  .toLowerCase()
                                  .replace(/\s+/g, '-')}`}
                              >
                                {child.status}
                              </span>
                            </div>
                            {child.logo && (
                              <div className="project-child__preview">
                                <img src={child.logo} alt={`${child.name} preview`} loading="lazy" />
                              </div>
                            )}
                            {child.metric && (
                              <div className="project-child__metric">
                                <span className="project-child__metric-value">{child.metric.value}</span>
                                <span className="project-child__metric-label">
                                  {child.metric.label}
                                  {child.metric.note && (
                                    <span className="project-child__metric-note">{child.metric.note}</span>
                                  )}
                                </span>
                              </div>
                            )}
                            {child.credit && <p className="project-child__credit">{child.credit}</p>}
                            <p className="project-child__desc">{child.description}</p>
                            <div className="project-child__stack">
                              {child.stack.map((tech) => (
                                <span key={tech}>{tech}</span>
                              ))}
                            </div>
                            <div className="project-child__links">
                              {child.links.map((l) => (
                                <a key={l.href} href={l.href} target="_blank" rel="noreferrer">{l.text}</a>
                              ))}
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </Reveal>
          ))}
            </div>
          </section>
        ))}
      </section>
    </PageTransition>
  );
}
