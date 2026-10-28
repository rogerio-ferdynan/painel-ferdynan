CREATE TABLE panel_google_config (id TEXT PRIMARY KEY NOT NULL, encrypted TEXT NOT NULL, updated_at TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE panel_google_tokens (id TEXT PRIMARY KEY NOT NULL, encrypted TEXT NOT NULL, updated_at TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE panel_google_oauth (state_hash TEXT PRIMARY KEY NOT NULL, session_hash TEXT NOT NULL, encrypted TEXT NOT NULL, expires_at INTEGER NOT NULL);
