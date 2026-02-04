-- Private templates: only visible to owner. Others see nothing (not on frontpage, profile, or by URL).

ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_templates_is_private ON templates(is_private) WHERE is_private = false;

-- Replace "viewable by everyone" with: public OR owner
DROP POLICY IF EXISTS "Templates are viewable by everyone" ON templates;
CREATE POLICY "Templates visible when public or owner" ON templates
  FOR SELECT USING (is_private = false OR auth.uid() = user_id);
