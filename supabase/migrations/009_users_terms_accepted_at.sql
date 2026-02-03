-- Timestamp when user accepted Terms of Use (for record-keeping)
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
