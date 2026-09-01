-- SJ.SYS session counter. Safe to re-run: the table creation is guarded and the
-- seed is INSERT OR IGNORE, so running this twice will not reset a live count.
--
--   wrangler d1 execute sjsys-guestbook --remote --file=./counters.sql
--
-- Split out from schema.sql because that file creates `entries` unguarded and
-- would fail against the database that is already live.

CREATE TABLE IF NOT EXISTS counters (
  name  TEXT    PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

-- Starts at zero on purpose.
--
-- The first version of this seeded 2110, Cloudflare's unique-visitor count for
-- August 2026, so the footer would not open on 000000. That number was real but
-- it was not this number: Cloudflare counts unique visitors, this counts browser
-- sessions, and gluing one to the front of the other made the total a figure
-- that measured two different things and was therefore true of neither.
--
-- Zero is worth more than a flattering head start. Every digit after it is one
-- this site actually counted, which is the only property that makes a number in
-- a footer worth reading at all.
INSERT OR IGNORE INTO counters (name, value) VALUES ('sessions', 0);
