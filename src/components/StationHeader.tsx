import type { ReactNode } from 'react';
import ScrambleText from './ScrambleText';
import './StationHeader.css';

export type Line = 'business' | 'projects' | 'poetry' | 'media' | 'travel' | 'guestbook' | 'transmissions';

/* The bullet each line carries, the way a TTC sign shows a numbered circle.
   The first four are Toronto's own lines (1 Yonge-University, 2 Bloor-Danforth,
   4 Sheppard, 5 Eglinton), Guestbook borrows Line 6's silver, Travel is the
   TSJ itself, and Transmissions is the site's own cyan line. */
const BULLET: Record<Line, string> = {
  business: '1',
  projects: '2',
  poetry: '4',
  media: '5',
  travel: 'TSJ',
  guestbook: '6',
  transmissions: 'TX',
};

interface StationHeaderProps {
  line: Line;
  /** The page's name, as the visitor would call it. */
  name: string;
  /** The page's old file name (LEDGER.XLSX…), kept as a small tag beside the
   *  name: the joke survives, it just stops being the title. */
  file?: string;
  desc?: ReactNode;
  /** A count or status for the right of the description row. */
  meta?: ReactNode;
  accentFrom?: number;
  /** A post or poem page already has its own h1 (the piece's title), so its
   *  sign names the line in a paragraph instead. */
  as?: 'h1' | 'p';
  children?: ReactNode;
}

/**
 * Every page's sign: the line's bullet, the page name, and a track in the line
 * colour running the width of the page, the same track the home page's stops
 * sit on. The name is the page's h1.
 *
 * Replaces seven hand-built headers and the `srihith@sj.exe:~$` bars that sat
 * under them; the terminal lives in the nav, once.
 */
export default function StationHeader({ line, name, file, desc, meta, accentFrom, as: Name = 'h1', children }: StationHeaderProps) {
  const bullet = BULLET[line];
  return (
    <header className="station">
      <div className="station__sign">
        <span className={`station__bullet${bullet.length > 2 ? ' is-wide' : ''}`} aria-hidden="true">
          {bullet}
        </span>
        <Name className="station__name">
          <ScrambleText text={name} accentFrom={accentFrom} />
        </Name>
        {file && <span className="station__file">{file}</span>}
      </div>
      <div className="station__track" aria-hidden="true" />
      {(desc || meta) && (
        <div className="station__row">
          {desc && <p className="station__desc">{desc}</p>}
          {meta && <p className="station__meta">{meta}</p>}
        </div>
      )}
      {children}
    </header>
  );
}
