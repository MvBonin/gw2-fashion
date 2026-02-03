-- Soft-delete support: only active templates appear in listings and by-slug lookup
ALTER TABLE templates ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(active) WHERE active = true;
