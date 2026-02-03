-- Tags: own table + template_tags junction, migrate from templates.tags, then drop column

-- Tags table (name stored normalized: lower + trim)
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX tags_name_key ON tags (name);

-- Junction table template_tags
CREATE TABLE template_tags (
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (template_id, tag_id)
);

CREATE INDEX idx_template_tags_tag_id ON template_tags(tag_id);

-- Migrate existing tags: distinct normalized names into tags
INSERT INTO tags (name)
SELECT DISTINCT LOWER(TRIM(tag_name::text))
FROM templates,
  LATERAL unnest(templates.tags) AS tag_name
WHERE templates.tags IS NOT NULL
  AND array_length(templates.tags, 1) > 0
ON CONFLICT (name) DO NOTHING;

-- Link templates to tags via template_tags (while templates.tags still exists)
INSERT INTO template_tags (template_id, tag_id)
SELECT t.id, tg.id
FROM templates t,
  LATERAL unnest(t.tags) AS tag_name
JOIN tags tg ON tg.name = LOWER(TRIM(tag_name::text))
WHERE t.tags IS NOT NULL
  AND array_length(t.tags, 1) > 0
ON CONFLICT (template_id, tag_id) DO NOTHING;

-- Drop old column
ALTER TABLE templates DROP COLUMN IF EXISTS tags;

-- RLS: tags readable by all; insert by authenticated
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are viewable by everyone" ON tags
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert tags" ON tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- template_tags: readable by all; insert/delete only for template owner
ALTER TABLE template_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Template tags are viewable by everyone" ON template_tags
  FOR SELECT USING (true);

CREATE POLICY "Template owners can insert template tags" ON template_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = template_tags.template_id
        AND templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Template owners can delete template tags" ON template_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = template_tags.template_id
        AND templates.user_id = auth.uid()
    )
  );
