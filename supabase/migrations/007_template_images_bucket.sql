-- Template images storage bucket (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('template-images', 'template-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Anyone can read (public bucket)
CREATE POLICY "Template images are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'template-images');

-- RLS: Authenticated users can upload only to their own folder (user_id/filename)
CREATE POLICY "Authenticated users can upload template images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'template-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Users can update/delete only their own files
CREATE POLICY "Users can update own template images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'template-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own template images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'template-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
