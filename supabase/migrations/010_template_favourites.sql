-- Favourites: users can favourite templates; count drives trending/popular

-- Add favourite_count to templates
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS favourite_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_templates_favourite_count ON templates (favourite_count DESC);

-- Junction table: user_id + template_id (unique per user)
CREATE TABLE template_favourites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, template_id)
);

CREATE INDEX idx_template_favourites_template_id ON template_favourites (template_id);
CREATE INDEX idx_template_favourites_user_id ON template_favourites (user_id);

-- Trigger: increment templates.favourite_count on INSERT
CREATE OR REPLACE FUNCTION template_favourites_increment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE templates
  SET favourite_count = favourite_count + 1
  WHERE id = NEW.template_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER template_favourites_after_insert
  AFTER INSERT ON template_favourites
  FOR EACH ROW EXECUTE FUNCTION template_favourites_increment_count();

-- Trigger: decrement templates.favourite_count on DELETE
CREATE OR REPLACE FUNCTION template_favourites_decrement_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE templates
  SET favourite_count = GREATEST(0, favourite_count - 1)
  WHERE id = OLD.template_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER template_favourites_after_delete
  AFTER DELETE ON template_favourites
  FOR EACH ROW EXECUTE FUNCTION template_favourites_decrement_count();

-- RLS
ALTER TABLE template_favourites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Template favourites are viewable by everyone" ON template_favourites
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own favourites" ON template_favourites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favourites" ON template_favourites
  FOR DELETE USING (auth.uid() = user_id);
