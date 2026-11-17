-- Private, revocable client viewing links. Tokens use 256 bits of CSPRNG entropy.
-- Never grant access to editor, full media library, device sessions or other quotes.
CREATE TABLE IF NOT EXISTS quote_links (
  token TEXT PRIMARY KEY NOT NULL,
  quote_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER,
  revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_quote_links_quote ON quote_links(quote_id, revoked_at);
