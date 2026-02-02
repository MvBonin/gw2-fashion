-- Phase 4: Templates Table
-- Create templates table for fashion templates

-- Create armor_type enum
CREATE TYPE armor_type_enum AS ENUM ('light', 'medium', 'heavy');

-- Create templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  fashion_code TEXT NOT NULL,
  armor_type armor_type_enum NOT NULL,
  image_url TEXT,
  description TEXT,
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  copy_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_templates_slug ON templates(slug);
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_armor_type ON templates(armor_type);
CREATE INDEX idx_templates_created_at ON templates(created_at DESC);
CREATE INDEX idx_templates_copy_count ON templates(copy_count DESC);
CREATE INDEX idx_templates_view_count ON templates(view_count DESC);

-- Note: Partial index for trending filter cannot use NOW() as it's not IMMUTABLE
-- The trending filter will use the created_at and view_count indexes at query time

-- RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Everyone can view templates
CREATE POLICY "Templates are viewable by everyone" ON templates
  FOR SELECT USING (true);

-- Only authenticated users can create templates
CREATE POLICY "Authenticated users can create templates" ON templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only template owner can update
CREATE POLICY "Users can update own templates" ON templates
  FOR UPDATE USING (auth.uid() = user_id);

-- Only template owner can delete
CREATE POLICY "Users can delete own templates" ON templates
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

