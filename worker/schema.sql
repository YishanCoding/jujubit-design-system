CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mod TEXT NOT NULL,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  resolved_by TEXT,
  commit_url TEXT
);
CREATE TABLE IF NOT EXISTS login_attempts (ip TEXT NOT NULL, ts INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS comments_mod ON comments(mod);
CREATE INDEX IF NOT EXISTS login_attempts_ip_ts ON login_attempts(ip, ts);
