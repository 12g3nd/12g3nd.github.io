-- SJ.SYS guestbook schema. Run once after creating the D1 database:
--   wrangler d1 execute sjsys-guestbook --remote --file=./schema.sql
CREATE TABLE entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name  TEXT    NOT NULL,
  last_name   TEXT    NOT NULL,
  description TEXT    NOT NULL,   -- "3 words" field
  stroke_data TEXT    NOT NULL,   -- JSON array of stroke point arrays
  approved    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- The public read path filters on approved; index it so the queue scan stays cheap.
CREATE INDEX idx_entries_approved_created ON entries (approved, created_at DESC);
