-- Share actions and anonymous visit accounting, no IP / user agent / personal info stored.
-- An "Enviada" quote means link handoff started, not WhatsApp delivery confirmation.
CREATE TABLE IF NOT EXISTS quote_share_events (
 id TEXT PRIMARY KEY NOT NULL,
 quote_id TEXT NOT NULL,
 token TEXT NOT NULL,
 channel TEXT NOT NULL CHECK(channel IN ('whatsapp','copy')),
 created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_quote_share_events_quote ON quote_share_events(quote_id);
CREATE TABLE IF NOT EXISTS quote_share_visits (
 id TEXT PRIMARY KEY NOT NULL,
 quote_id TEXT NOT NULL,
 token TEXT NOT NULL,
 visitor_hash TEXT NOT NULL,
 visit_id TEXT NOT NULL,
 created_at INTEGER NOT NULL DEFAULT (unixepoch()),
 UNIQUE(token,visit_id)
);
CREATE INDEX IF NOT EXISTS idx_quote_share_visits_quote ON quote_share_visits(quote_id);
