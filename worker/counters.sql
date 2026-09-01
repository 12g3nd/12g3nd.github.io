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

-- Seeded rather than started at zero, so the footer does not open on 000000
-- the day it ships.
--
-- Where 2110 comes from: Cloudflare recorded 2.11k unique visitors between
-- 2 August and 1 September 2026. Note the seam — that figure is Cloudflare's
-- "unique visitors" for one month, while everything added after it is this
-- app's own count of browser sessions. The two are not the same measurement,
-- which is why the footer says SINCE 2026.08 and calls them sessions rather
-- than claiming a count of people.
INSERT OR IGNORE INTO counters (name, value) VALUES ('sessions', 2110);
