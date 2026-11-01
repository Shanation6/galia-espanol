CREATE TABLE leads (
 id TEXT PRIMARY KEY NOT NULL,
 request_id TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL,
 contact TEXT NOT NULL,
 goal TEXT NOT NULL,
 level TEXT NOT NULL,
 note TEXT NOT NULL DEFAULT '',
 source TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'new',
 admin_note TEXT NOT NULL DEFAULT '',
 consent_at TEXT NOT NULL,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX leads_created ON leads(created_at);
--> statement-breakpoint
CREATE TABLE rate_limits (key TEXT PRIMARY KEY NOT NULL, count INTEGER NOT NULL DEFAULT 1, expires_at INTEGER NOT NULL);
