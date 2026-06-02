import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import ScrambleText from '../components/ScrambleText';
import useDocumentMeta from '../hooks/useDocumentMeta';
import './Business.css';

/* The business / finance pillar, framed as business.xlsx — a read-only
   workbook. Seeded with verifiable résumé credentials; COVERAGE holds the
   write-up slots that promote this from a hidden route to a nav tab (Phase 2). */

const experience = [
  {
    role: 'Summer Research Associate',
    org: 'Sartorial Wealth',
    period: 'May 2026 — Present',
    tag: 'CURRENT',
    note: 'Equity & cross-asset market analysis supporting and streamlining PM investment decisions. Built and maintained financial models and back-tested strategies for validation; Python (NumPy/Pandas) across large datasets.',
  },
];

const trackRecord = [
  { year: '2025', item: 'Bloomberg Finance Fundamentals', tag: 'CERT' },
  { year: '2025', item: 'DECA — Provincial Champion', tag: 'CASE COMP' },
  { year: '2024', item: 'DECA — Provincial Champion', tag: 'CASE COMP' },
  { year: '2024', item: 'DECA ICDC — Silver Seal', tag: 'INTERNATIONAL' },
  { year: '2024', item: 'BASEF — Inspiration Award + Silver Merit', tag: 'RESEARCH' },
];

// COVERAGE sheet is commented out until there are write-ups to show.
// const coverage = [
//   { ref: 'EQ-001', title: 'Equity pitch / investment memo', tag: 'DRAFTING' },
//   { ref: 'CS-001', title: 'Case retrospective', tag: 'DRAFTING' },
// ];

const desk = [
  'Toronto Student Investment Counsel (Foundations Program)',
  'BMO Finance Research & Trading Lab — Bloomberg Terminal · FactSet',
  'Rotman Commerce, BCom at the University of Toronto',
];

const toolbar = ['Financial Modelling', 'Data Analysis', 'Python', 'R', 'SQL', 'Bloomberg', 'FactSet', 'Excel'];

const SHEETS = 2;

export default function Business() {
  useDocumentMeta(
    'Business // Srihith Jarabana',
    'The business and finance side of Srihith Jarabana (research experience, competition track record, and investment write-ups).'
  );

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
          <span className="xls-bar__count">{SHEETS} sheets · read-only</span>
        </div>

        <div className="xls-book">
          {/* ── Sheet 01: EXPERIENCE ───────────────────────────── */}
          <section className="xls-sheet">
            <div className="xls-sheet__tab">EXPERIENCE</div>
            <div className="xls-table">
              <div className="xls-row xls-row--head xls-row--exp">
                <span className="xls-gut">#</span>
                <span>ROLE</span>
                <span>ORG</span>
                <span>PERIOD</span>
              </div>
              {experience.map((r, i) => (
                <Reveal key={r.org} delay={i * 0.06}>
                  <div className="xls-row xls-row--exp">
                    <span className="xls-gut">{i + 1}</span>
                    <span className="xls-cell xls-cell--key">
                      {r.role}
                      <span className="xls-chip xls-chip--current">{r.tag}</span>
                    </span>
                    <span className="xls-cell">{r.org}</span>
                    <span className="xls-cell xls-cell--dim">{r.period}</span>
                  </div>
                  <p className="xls-note">{r.note}</p>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ── Sheet 02: TRACK_RECORD ─────────────────────────── */}
          <section className="xls-sheet">
            <div className="xls-sheet__tab">TRACK_RECORD</div>
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

          {/* ── Sheet 03: COVERAGE (artifact slots — Phase 2) ────
              Commented out until there are write-ups to show. */}
          {/*
          <section className="xls-sheet">
            <div className="xls-sheet__tab">COVERAGE</div>
            <div className="xls-table">
              <div className="xls-row xls-row--head xls-row--cov">
                <span className="xls-gut">#</span>
                <span>REF</span>
                <span>WRITE-UP</span>
                <span>STATUS</span>
              </div>
              {coverage.map((r, i) => (
                <div className="xls-row xls-row--cov xls-row--pending" key={r.ref}>
                  <span className="xls-gut">{i + 1}</span>
                  <span className="xls-cell xls-cell--dim">{r.ref}</span>
                  <span className="xls-cell">{r.title}</span>
                  <span className="xls-cell"><span className="xls-chip xls-chip--pending">{r.tag}</span></span>
                </div>
              ))}
            </div>
            <p className="xls-caption">// investment write-ups &amp; case studies land here. building.</p>
          </section>
          */}

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
