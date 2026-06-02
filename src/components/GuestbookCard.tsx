import type { GuestbookEntry } from '../types/guestbook';
import SignatureCanvas from './SignatureCanvas';

interface GuestbookCardProps {
  entry: GuestbookEntry;
  compact?: boolean;
}

// created_at is a SQLite datetime ("2026-06-02 14:30:00", UTC) or an ISO string;
// the date portion is all we surface, matching the Poetry doc-page date stamp.
function formatDate(value: string): string {
  return value ? value.slice(0, 10) : '';
}

export default function GuestbookCard({ entry, compact = false }: GuestbookCardProps) {
  return (
    <article className={`gb-card${compact ? ' gb-card--compact' : ''}`}>
      <span className="gb-card__date">{formatDate(entry.created_at)}</span>
      <h3 className="gb-card__name">
        {entry.first_name} {entry.last_name}
      </h3>
      <p className="gb-card__desc">{entry.description}</p>
      <div className="gb-card__sig">
        <SignatureCanvas
          mode="replay"
          strokes={entry.stroke_data}
          width={compact ? 240 : 280}
          height={compact ? 80 : 110}
        />
      </div>
    </article>
  );
}
