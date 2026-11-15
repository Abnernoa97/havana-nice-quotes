-- Reversible Trash in the same D1 database, preserving existing records.
ALTER TABLE quotes ADD COLUMN deleted_at INTEGER DEFAULT NULL;
ALTER TABLE media ADD COLUMN deleted_at INTEGER DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_deleted ON quotes(deleted_at);
CREATE INDEX IF NOT EXISTS idx_media_deleted ON media(deleted_at);
