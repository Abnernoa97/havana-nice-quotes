-- Passwordless one-time device enrollment. The bootstrap link hash is seeded
-- privately through the Cloudflare API; no plaintext code in this repository.
CREATE TABLE IF NOT EXISTS device_invites (
  token_hash TEXT PRIMARY KEY NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  used_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_device_invites_expiry ON device_invites(expires_at);
CREATE TABLE IF NOT EXISTS device_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_device_sessions_expiry ON device_sessions(expires_at);
