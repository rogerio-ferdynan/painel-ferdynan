CREATE TABLE panel_state (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, revision INTEGER NOT NULL, updated_at TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE panel_sessions (token_hash TEXT PRIMARY KEY NOT NULL, expires_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE panel_login_attempts (attempt_key TEXT PRIMARY KEY NOT NULL, failures INTEGER NOT NULL DEFAULT 0, reset_at INTEGER NOT NULL);
