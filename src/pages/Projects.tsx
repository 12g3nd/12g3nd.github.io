import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import StationHeader from '../components/StationHeader';
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
    label: 'Selected work',
    blurb: 'the ones I would show you first',
  },
  {
    key: 'studio',
    label: 'Studio work',
    blurb: 'everything shipping under FI99 Inc.',
  },
  {
    key: 'tools',
    label: 'Small tools & experiments',
    blurb: 'the rest of what I have built and kept running',
  },
  {
    key: 'archive',
    label: 'Archive',
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
  /* richer chip label (multi-word); falls back to the status itself */
  statusLabel?: string;
  /* headline number, pulled out big so the work reads at a glance */
  metric?: Metric;
  /* Byline for work that isn't solely mine, ships under the studio, or needs
     its provenance stated. */
  credit?: string;
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
      { href: 'https://fi99.ca', text: 'Visit live ↗' },
      { href: 'https://fi99.ca/team/', text: 'The team ↗' },
      { href: 'https://github.com/FI99-Inc', text: 'View org ↗' },
    ],
    logo: '/projects/fi99.jpg',
    status: 'STUDIO',
    statusLabel: '◆ STUDIO',
    metric: { value: '4', label: 'projects shipped under it', note: 'incorporated Jul 2026' },
    children: [
      {
        name: 'Fallow',
        description:
          "Thirteen questions about how your brain actually works — not about what you already like — and Fallow matches you to five activities you'd never have thought to search for. An advanced hobby finder for the bored and bold.",
        stack: ['JavaScript', 'Python', 'PostgreSQL'],
        status: 'IN THE LAB',
        links: [
          { href: 'https://fallow.fi99.ca', text: 'Live ↗' },
          { href: 'https://github.com/FI99-Inc/fallow', text: 'Repo ↗' },
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
          { href: 'https://write.fi99.ca', text: 'Live ↗' },
          { href: 'https://github.com/FI99-Inc/write', text: 'Repo ↗' },
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
      { href: 'https://waivelegal.vercel.app/', text: 'Visit live ↗' },
      { href: 'https://github.com/12g3nd/Waive', text: 'View repo ↗' },
      { href: 'https://devpost.com/software/waive', text: 'Devpost ↗' },
    ],
    logo: '/Waive.jpg',
    status: 'AWARD',
    metric: { value: '2nd', label: 'of 52 teams', note: 'STEMINATE Hacks 2026 · 281 participants' },
  },
  {
    key: 'verdant',
    section: 'selected',
    name: 'VERDANT',
    description:
      'A falsifiable recommendation engine for sparse, subjective preferences, grown out of a problem we hit in Fallow. v0.8 completed its preregistered confirmation experiment: cardinal scoring beat the historical formulation across all eleven simulated worlds, but the full policy failed six of the eleven confirmation screens, and the held-out audit was deliberately not run. Paused rather than quietly shipped — a system that cannot reject itself is not much of an experiment.',
    stack: ['Recommender Systems', 'Preregistration', 'Simulation'],
    links: [{ href: 'https://fi99.ca/research/verdant/', text: 'Read the research ↗' }],
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
      { href: 'https://ploton-zeta.vercel.app/', text: 'Visit live ↗' },
      { href: 'https://github.com/12g3nd/PlotON', text: 'View repo ↗' },
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
      { href: 'https://fantasy-agent-kappa.vercel.app', text: 'Visit live ↗' },
      { href: 'https://github.com/skiller99668/FantasyAgent', text: 'Source repo ↗' },
      { href: 'https://github.com/12g3nd/CourtIQ', text: 'My fork ↗' },
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
      { href: 'https://www.jarabana.com/LinguaScape/', text: 'Visit live ↗' },
      { href: 'https://github.com/12g3nd/LinguaScape', text: 'View repo ↗' },
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
    links: [{ href: 'https://github.com/12g3nd/ai-rule-miner', text: 'View repo ↗' }],
    status: 'REPO',
  },
  {
    key: 'frame-loop',
    section: 'tools',
    name: 'frame-loop',
    description:
      'A Manifest V3 Chrome extension that loops any HTML5 video between two frame-accurate points, not just the whole clip. Built to work where most loopers give up — including players that hide the video element inside a shadow DOM ordinary extensions cannot reach.',
    stack: ['JavaScript', 'Chrome MV3', 'Shadow DOM'],
    links: [{ href: 'https://github.com/12g3nd/frame-loop', text: 'View repo ↗' }],
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
      { href: 'https://github.com/12g3nd/lacquer', text: 'My fork ↗' },
      { href: 'https://github.com/pear-devs/pear-desktop', text: 'Upstream ↗' },
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
    links: [{ href: 'https://github.com/12g3nd/TheClearwaterForge', text: 'View repo ↗' }],
    status: 'REPO',
  },
  {
    key: 'drift',
    section: 'tools',
    name: 'drift',
    description:
      'Drift is a Chrome extension that replaces the standard new tab page with a living, procedurally generated landscape rendered from simple shapes.',
    stack: ['JavaScript', 'HTML'],
    links: [{ href: 'https://github.com/12g3nd/drift', text: 'View repo ↗' }],
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
      { href: 'https://krine.ca/', text: 'Read-only site ↗' },
      { href: 'https://github.com/12g3nd/Krine', text: 'Repo ↗' },
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
    links: [{ href: 'https://www.snapchat.com/lens/5f0f516178844f8a8980e5abb0d93ad0', text: 'View lens ↗' }],
    logo: '/filter.png',
    status: 'VIRAL',
    metric: { value: '198K', label: 'lens plays' },
  },
  {
    key: 'spring-break',
    section: 'archive',
    name: 'Spring Break Project',
    description:
      'A younger me during when I first became a teenager made a website where every Spring Break, I would write some articles. Kind of full circle to this website if you think about. Also, please do not flame me for my corniness back then.',
    stack: ['Google Sites'],
    links: [{ href: 'https://sites.google.com/view/springbreakproject/', text: 'View live ↗' }],
    logo: '/SBPPreview.png',
    status: 'ARCHIVE',
  },
];

/** `01`, `02`, … from a project's position, so the order is the only ordering. */
const num = (i: number) => String(i + 1).padStart(2, '0');

/* Grouped for display, but numbered as one continuous run down the page: the
   shelves are an editorial device, and restarting at 01 under each would make
   the list read like four unrelated indexes. Numbers are assigned here, once,
   from the rendered order — nothing downstream gets to invent its own. */
const shelves = SECTIONS.map((section) => ({
  ...section,
  items: projects.filter((p) => p.section === section.key),
}));

const numberOf = new Map<string, string>(
  shelves.flatMap((s) => s.items).map((p, i) => [p.key, num(i)])
);

/* The header counts everything built, children included — a count that only
   saw top-level projects would quietly start under-reporting the moment the
   studio tier grew. */
const packageCount =
  projects.length + projects.reduce((n, p) => n + (p.children?.length ?? 0), 0);

const statusClass = (status: string) => `proj-status proj-status--${status.toLowerCase().replace(/\s+/g, '-')}`;

function Status({ status, label }: { status?: string; label?: string }) {
  if (!status) return null;
  return <span className={statusClass(status)}>{label ?? status}</span>;
}

function Stack({ stack }: { stack: string[] }) {
  return (
    <ul className="proj-stack" aria-label="Built with">
      {stack.map((tech) => (
        <li key={tech}>{tech}</li>
      ))}
    </ul>
  );
}

/* The first destination is the project's front door, so it gets the chrome
   button in the line's green; the rest (repos, forks, write-ups) are plain
   links beside it. */
function Links({ links }: { links: Link[] }) {
  const [first, ...rest] = links;
  if (!first) return null;
  return (
    <div className="proj-links">
      <a className="btn-line btn-sm" href={first.href} target="_blank" rel="noreferrer">{first.text}</a>
      {rest.map((l) => (
        <a key={l.href} className="line-link" href={l.href} target="_blank" rel="noreferrer">{l.text}</a>
      ))}
    </div>
  );
}

function MetricLine({ metric }: { metric?: Metric }) {
  if (!metric) return null;
  return (
    <p className="proj-metric">
      <span className="proj-metric__value">{metric.value}</span>
      <span className="proj-metric__label">
        {metric.label}
        {metric.note && <span className="proj-metric__note">{metric.note}</span>}
      </span>
    </p>
  );
}

/* ── Everything below the case studies: an index ───────────────────────────
   One row per project: number, a small screenshot when there is one, the name
   and its write-up, the stack and the links. No tiles, so seven tools take
   the room three used to. */
type RowProps = {
  n: string;
  name: string;
  level?: 'h3' | 'h4';
  status?: string;
  statusLabel?: string;
  logo?: string;
  credit?: string;
  metric?: Metric;
  description: string;
  stack: string[];
  links: Link[];
};

function IndexRow({ n, name, level: Heading = 'h3', status, statusLabel, logo, credit, metric, description, stack, links }: RowProps) {
  return (
    <li className="proj-row">
      <span className="proj-row__num">{n}</span>
      <div className={`proj-row__thumb${logo ? '' : ' is-empty'}`}>
        {logo ? <img src={logo} alt={`${name} preview`} loading="lazy" decoding="async" /> : <span aria-hidden="true">{stack[0]}</span>}
      </div>
      <div className="proj-row__main">
        <div className="proj-row__head">
          <Heading className="proj-row__name">{name}</Heading>
          <Status status={status} label={statusLabel} />
        </div>
        {credit && <p className="proj-credit">{credit}</p>}
        <MetricLine metric={metric} />
        <p className="proj-row__desc">{description}</p>
        <Stack stack={stack} />
      </div>
      <Links links={links} />
    </li>
  );
}

const rowOf = (project: Project) => (
  <IndexRow
    key={project.key}
    n={numberOf.get(project.key) ?? ''}
    name={project.name}
    status={project.status}
    statusLabel={project.statusLabel}
    logo={project.logo}
    credit={project.credit}
    metric={project.metric}
    description={project.description}
    stack={project.stack}
    links={project.links}
  />
);

/* ── Selected work and the studio: case-study rows ─────────────────────────
   A big screenshot and the full write-up side by side, alternating sides down
   the shelf, so the projects worth judging me on read as work rather than as
   equal tiles. */
function CaseRow({ project }: { project: Project }) {
  return (
    <article className="case">
      <figure className="case__shot">
        {project.logo ? (
          <img src={project.logo} alt={`${project.name} preview`} loading="lazy" decoding="async" />
        ) : (
          <span className="case__placeholder">{project.name}</span>
        )}
      </figure>
      <div className="case__body">
        <p className="case__kicker">
          <span className="case__num">{numberOf.get(project.key)}</span>
          <Status status={project.status} label={project.statusLabel} />
        </p>
        <h3 className="case__name">{project.name}</h3>
        {project.credit && <p className="proj-credit">{project.credit}</p>}
        <MetricLine metric={project.metric} />
        <p className="case__desc">{project.description}</p>
        <Stack stack={project.stack} />
        <Links links={project.links} />
      </div>
      {project.children && (
        <div className="case__children">
          <p className="case__children-label">
            Shipped under the studio <span>{project.children.length} projects</span>
          </p>
          <ol className="proj-index proj-index--children">
            {project.children.map((child, j) => (
              <IndexRow
                key={child.name}
                n={`${numberOf.get(project.key)}.${j + 1}`}
                name={child.name}
                level="h4"
                status={child.status}
                logo={child.logo}
                credit={child.credit}
                metric={child.metric}
                description={child.description}
                stack={child.stack}
                links={child.links}
              />
            ))}
          </ol>
        </div>
      )}
    </article>
  );
}

function ShelfHead({ label, blurb, count }: { label: string; blurb: string; count?: number }) {
  return (
    <div className="proj-shelf__head">
      <h2 className="proj-shelf__label">{label}</h2>
      <span className="proj-shelf__blurb">
        {blurb}
        {count !== undefined && <span className="proj-shelf__count">{count}</span>}
      </span>
    </div>
  );
}

export default function Projects() {
  useDocumentMeta(routeMeta.projects.title, routeMeta.projects.description);
  const [selected, studio, tools, archive] = shelves;
  return (
    <PageTransition>
      <section className="section line--projects">
        <StationHeader
          line="projects"
          name="Projects"
          file="pkg list --built"
          desc="the second pillar: things I've built (platforms, tools, and experiments)"
          meta={`${packageCount} packages`}
        />

        <section className="proj-shelf">
          <ShelfHead label={selected.label} blurb={selected.blurb} />
          <div className="case-list">
            {selected.items.map((project) => (
              <Reveal key={project.key}>
                <CaseRow project={project} />
              </Reveal>
            ))}
          </div>
        </section>

        <section className="proj-shelf">
          <ShelfHead label={studio.label} blurb={studio.blurb} />
          <div className="case-list case-list--studio">
            {studio.items.map((project) => (
              <Reveal key={project.key}>
                <CaseRow project={project} />
              </Reveal>
            ))}
          </div>
        </section>

        <section className="proj-shelf">
          <ShelfHead label={tools.label} blurb={tools.blurb} count={tools.items.length} />
          <ol className="proj-index">{tools.items.map(rowOf)}</ol>
        </section>

        {/* Retired on purpose, so it starts folded: a visitor who opens it
            knows they are looking at old work. */}
        <details className="proj-shelf proj-archive">
          <summary>
            <ShelfHead label={archive.label} blurb={archive.blurb} count={archive.items.length} />
          </summary>
          <ol className="proj-index">{archive.items.map(rowOf)}</ol>
        </details>
      </section>
    </PageTransition>
  );
}
