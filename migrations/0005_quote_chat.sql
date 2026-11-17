-- Conversaciones por página, independientes del layout y sin registrar voz en el JSON de la cotización.
CREATE TABLE IF NOT EXISTS quote_chat_messages (
 id TEXT PRIMARY KEY NOT NULL,
 quote_id TEXT NOT NULL,
 page_id INTEGER NOT NULL,
 sender TEXT NOT NULL CHECK(sender IN ('owner','client')),
 kind TEXT NOT NULL CHECK(kind IN ('text','audio')),
 text TEXT NOT NULL DEFAULT '',
 audio_key TEXT,
 mime TEXT,
 created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_quote_chat_page ON quote_chat_messages(quote_id,page_id,created_at,id);
CREATE INDEX IF NOT EXISTS idx_quote_chat_sender ON quote_chat_messages(quote_id,sender,created_at);
