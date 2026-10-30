-- Shadowfall Idle Community Idea Board — Cloudflare D1 schema
-- Apply only to the separate PUBLIC community-board database, never the private game repository.
CREATE TABLE IF NOT EXISTS suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL CHECK(length(nickname) BETWEEN 2 AND 24),
  title TEXT NOT NULL CHECK(length(title) BETWEEN 5 AND 100),
  category TEXT NOT NULL,
  description TEXT NOT NULL CHECK(length(description) BETWEEN 30 AND 1200),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','acknowledged','added','rejected')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  acknowledged_at INTEGER,
  added_at INTEGER,
  rejected_at INTEGER,
  reviewer_note TEXT NOT NULL DEFAULT '',
  ip_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suggestions_rate ON suggestions(ip_hash, created_at DESC);
CREATE TABLE IF NOT EXISTS moderation_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  suggestion_id INTEGER NOT NULL REFERENCES suggestions(id),
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_suggestion ON moderation_events(suggestion_id, at);
