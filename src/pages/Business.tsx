import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import ScrambleText from '../components/ScrambleText';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { routeMeta } from '../data/routeMeta';
import './Business.css';

/* The business / finance pillar, framed as business.xlsx — a read-only
   workbook. Every claim here is one a reader could check against resume.pdf,
   which hangs off the workbook as its own sheet. */

/* An org holds roles, not the other way round. Sartorial is one employer with
   two titles (a summer role that converted to a term role); flattening that to
   two sibling rows would read as leaving and being rehired. Roles are listed
   newest-first within an org, orgs newest-first overall. */
type Role = {
  role: string;
  period: string;
  note: string;
};

type Org = {
  org: string;
  location: string;
  /* Total span across every role — the org's own dates, not any one role's. */
  span: string;
  tag?: string;
  /* Drives the chip colour; defaults to the neutral chip. */
  tagKind?: 'current' | 'founder';
  roles: Role[];
};

const experience: Org[] = [
  {
    org: 'Sartorial Wealth',
    location: 'Toronto, ON',
    span: 'May 2026 — Present',
    tag: 'CURRENT',
    tagKind: 'current',
    roles: [
      {
        role: 'Research Associate',
        period: 'Sep 2026 — Present',
        note: 'Conduct equity and cross-asset research for portfolio managers, building and back-testing models and strategies and analyzing datasets via FactSet and YCharts in Python/SQL to support investment decisions.',
      },
      {
        role: 'Summer Research Associate',
        period: 'May 2026 — Aug 2026',
        note: 'Built proprietary research apps, algorithms, and experimental tools for portfolio managers and the CEO, using AI-assisted and agentic development to automate workflows and rapidly prototype new ideas.',
      },
    ],
  },
  {
    org: 'FI99 Inc.',
    location: 'Toronto, ON',
    span: 'Jul 2026 — Present',
    tag: 'FOUNDER',
    tagKind: 'founder',
    roles: [
      {
        role: 'Co-founder & Director',
        period: 'Jul 2026 — Present',
        note: 'Co-founded an incorporated experimental studio with Omar Badawy and Lars Fransen-Molino. Built fi99.ca end-to-end and shipped studio and client projects including Krine, PlotON, Fallow, and WR!TE.',
      },
    ],
  },
  {
    org: 'University of Toronto, Rotman School of Management',
    location: 'Toronto, ON',
    span: 'Summer 2026',
    roles: [
      {
        role: 'Research Assistant — Field Team Member | Prof. Tosen Nwadei',
        period: 'Summer 2026',
        note: 'Recruited and screened participants for a field experiment across Toronto events, adapting cold outreach and communicating study requirements and incentives across high-volume public interactions.',
      },
    ],
  },
];

const trackRecord = [
  { year: '2026', item: 'STEMINATE Hacks — 2nd of 52 teams', tag: 'HACKATHON' },
  { year: '2025', item: 'Bloomberg Market Concepts', tag: 'CERT' },
  { year: '2025', item: 'DECA — Provincial Champion', tag: 'CASE COMP' },
  { year: '2024', item: 'DECA — Provincial Champion', tag: 'CASE COMP' },
  { year: '2024', item: 'DECA ICDC — Silver Seal', tag: 'INTERNATIONAL' },
  { year: '2024', item: 'BASEF — Inspiration Award + Silver Merit', tag: 'RESEARCH' },
  { year: '—', item: 'Python & Django Full Stack Web Developer Bootcamp', tag: 'CERT' },
];

/* Neither a job nor an award, so neither of the sheets above will hold them:
   a degree in progress and a four-year mentorship. */
const serviceEducation = [
  {
    entry: 'Rotman Commerce, BCom',
    detail: 'Management Specialist (Finance Focus); Minors in Statistics & Economics',
    period: 'Expected May 2029',
    note: null,
  },
  {
    entry: 'The Homework Club — Mentor',
    detail: 'Big Brothers Big Sisters, Oakville, ON',
    period: 'Jul 2021 — Jun 2025',
    note: 'Mentored elementary-school students through long-term academic and personal support.',
  },
];

/* Affiliations only. The degree moved to the SERVICE & EDUCATION sheet, where
   it can carry the specialist and minors without crowding a footer strip. */
const desk = [
  'Toronto Student Investment Counsel (Foundations Program)',
  'BMO Finance Research & Trading Lab — Bloomberg Terminal · FactSet',
];

const toolbar = [
  'Financial Modelling',
  'Backtesting',
  'Equity Research',
  'Python (Pandas/NumPy)',
  'SQL',
  'R',
  'TypeScript',
  'React',
  'Django',
  'Git',
  'Bloomberg Terminal',
  'FactSet',
  'Agentic Coding',
];

/* One source for the tab labels and the workbook's sheet count, so adding a
   sheet can't leave the chrome claiming a number that stopped being true. */
const SHEET_TABS = ['EXPERIENCE', 'TRACK_RECORD', 'SERVICE & EDUCATION', 'RESUME.PDF'] as const;

export default function Business() {
  useDocumentMeta(routeMeta.business.title, routeMeta.business.description);

  return (
    <PageTransition>
      <section className="section">
        <div className="section-header">
          <h2><ScrambleText text="LEDGER.XLSX" /></h2>
          <p className="section-desc">the first pillar: experience, track record, and write-ups, in pseudo-spreadsheet form</p>
        </div>

        {/* Workbook chrome: the per-section "temperature" — a read-only .xlsx,
            finance's native file type, not just another card grid. */}
        <div className="xls-bar">
          <span className="xls-bar__cmd"><span className="xls-bar__prompt">srihith@sj.sys:~$</span> open business.xlsx</span>
          <span className="xls-bar__count">{SHEET_TABS.length} sheets · read-only</span>
        </div>

        <div className="xls-book">
          {/* ── Sheet 01: EXPERIENCE ───────────────────────────
              Org bands with role rows nested beneath, numbered 1 / 1.1 / 1.2
              the way the projects manifest numbers its children. */}
          <section className="xls-sheet">
            <div className="xls-sheet__tab">{SHEET_TABS[0]}</div>
            <div className="xls-table">
              <div className="xls-row xls-row--head xls-row--exp">
                <span className="xls-gut">#</span>
                <span>ORG / ROLE</span>
                <span>LOCATION</span>
                <span>PERIOD</span>
              </div>
              {experience.map((org, i) => (
                <Reveal key={org.org} delay={i * 0.06}>
                  <div className="xls-row xls-row--exp xls-row--org">
                    <span className="xls-gut">{i + 1}</span>
                    <span className="xls-cell xls-cell--org">
                      {org.org}
                      {org.tag && (
                        <span className={`xls-chip xls-chip--${org.tagKind ?? 'plain'}`}>{org.tag}</span>
                      )}
                    </span>
                    <span className="xls-cell xls-cell--dim">{org.location}</span>
                    <span className="xls-cell xls-cell--dim">{org.span}</span>
                  </div>
                  {org.roles.map((r, j) => (
                    <div key={r.role}>
                      <div className="xls-row xls-row--exp xls-row--role">
                        <span className="xls-gut">{i + 1}.{j + 1}</span>
                        <span className="xls-cell xls-cell--key">{r.role}</span>
                        {/* Location belongs to the org band above, not to each
                            role under it — a blank cell, as a sheet would have. */}
                        <span className="xls-cell" aria-hidden="true" />
                        <span className="xls-cell xls-cell--dim">{r.period}</span>
                      </div>
                      <p className="xls-note">{r.note}</p>
                    </div>
                  ))}
                </Reveal>
              ))}
            </div>
          </section>

          {/* ── Sheet 02: TRACK_RECORD ─────────────────────────── */}
          <section className="xls-sheet">
            <div className="xls-sheet__tab">{SHEET_TABS[1]}</div>
            <div className="xls-table">
              <div className="xls-row xls-row--head xls-row--rec">
                <span className="xls-gut">#</span>
                <span>YEAR</span>
                <span>AWARD / CREDENTIAL</span>
                <span>CLASS</span>
              </div>
              {trackRecord.map((r, i) => (
                <Reveal key={`${r.year}-${r.item}`} delay={Math.min(i, 4) * 0.05}>
                  <div className="xls-row xls-row--rec">
                    <span className="xls-gut">{i + 1}</span>
                    <span className="xls-cell xls-cell--dim">{r.year}</span>
                    <span className="xls-cell xls-cell--key">{r.item}</span>
                    <span className="xls-cell"><span className="xls-chip">{r.tag}</span></span>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ── Sheet 03: SERVICE & EDUCATION ──────────────────── */}
          <section className="xls-sheet">
            <div className="xls-sheet__tab">{SHEET_TABS[2]}</div>
            <div className="xls-table">
              <div className="xls-row xls-row--head xls-row--svc">
                <span className="xls-gut">#</span>
                <span>ENTRY</span>
                <span>DETAIL</span>
                <span>PERIOD</span>
              </div>
              {serviceEducation.map((r, i) => (
                <Reveal key={r.entry} delay={i * 0.06}>
                  <div className="xls-row xls-row--svc">
                    <span className="xls-gut">{i + 1}</span>
                    <span className="xls-cell xls-cell--key">{r.entry}</span>
                    <span className="xls-cell xls-cell--dim">{r.detail}</span>
                    <span className="xls-cell xls-cell--dim">{r.period}</span>
                  </div>
                  {r.note && <p className="xls-note">{r.note}</p>}
                </Reveal>
              ))}
            </div>
          </section>

          {/* ── Sheet 04: RESUME.PDF ───────────────────────────
              The raw file, attached to the workbook like any other sheet. */}
          <section className="xls-sheet">
            <div className="xls-sheet__tab">{SHEET_TABS[3]}</div>
            <div className="xls-table">
              <div className="xls-row xls-row--head xls-row--file">
                <span className="xls-gut">#</span>
                <span>FILE</span>
                <span>NOTE</span>
                <span>LINK</span>
              </div>
              <Reveal>
                <div className="xls-row xls-row--file">
                  <span className="xls-gut">1</span>
                  <span className="xls-cell xls-cell--key">resume.pdf</span>
                  <span className="xls-cell xls-cell--dim">the workbook above, exported to one page</span>
                  <span className="xls-cell xls-cell--links">
                    <a href="/resume.pdf" target="_blank" rel="noreferrer">[OPEN ↗]</a>
                    <a href="/resume.pdf" download="Srihith-Jarabana-Resume.pdf">[DOWNLOAD ↓]</a>
                  </span>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── Footer strips: affiliations + skill toolbar ────── */}
          <div className="xls-strips">
            <div className="xls-strip">
              <h4 className="xls-strip__label">[DESK]</h4>
              <ul className="xls-desk">
                {desk.map((d) => (
                  <li key={d}><span className="xls-desk__bullet">&gt;</span> {d}</li>
                ))}
              </ul>
            </div>
            <div className="xls-strip">
              <h4 className="xls-strip__label">[TOOLBAR]</h4>
              <div className="xls-toolbar">
                {toolbar.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
