-- Template extra images: up to 3 additional images per template (position 1, 2, 3)
CREATE TABLE template_extra_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  position SMALLINT NOT NULL CHECK (position >= 1 AND position <= 3),
  image_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(template_id, position)
);

CREATE INDEX idx_template_extra_images_template_id ON template_extra_images(template_id);

-- RLS
ALTER TABLE template_extra_images ENABLE ROW LEVEL SECURITY;

-- Everyone can view extra images
CREATE POLICY "Template extra images are viewable by everyone" ON template_extra_images
  FOR SELECT USING (true);

-- Only template owner can insert
CREATE POLICY "Template owner can insert extra images" ON template_extra_images
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM templates WHERE id = template_id)
  );

-- Only template owner can update
CREATE POLICY "Template owner can update extra images" ON template_extra_images
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM templates WHERE id = template_id)
  );

-- Only template owner can delete
CREATE POLICY "Template owner can delete extra images" ON template_extra_images
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM templates WHERE id = template_id)
  );
