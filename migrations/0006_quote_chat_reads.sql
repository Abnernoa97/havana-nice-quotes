-- Shared owner-side read cursors across connected HAVANA NICE devices.
-- Uses message rowid rather than coarse Unix seconds to avoid missing simultaneous messages.
CREATE TABLE IF NOT EXISTS quote_chat_reads (
 quote_id TEXT PRIMARY KEY NOT NULL,
 last_seen_rowid INTEGER NOT NULL DEFAULT 0,
 updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
