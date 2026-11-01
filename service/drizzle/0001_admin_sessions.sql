CREATE TABLE admin_sessions (
 token_hash TEXT PRIMARY KEY NOT NULL,
 credential_version TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX admin_sessions_expires ON admin_sessions(expires_at);
