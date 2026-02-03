-- User profile description (bio)
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
