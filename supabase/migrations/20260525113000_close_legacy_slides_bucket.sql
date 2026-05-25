UPDATE storage.buckets
SET public = false
WHERE id = 'slides';

DROP POLICY IF EXISTS "Public Access" ON storage.objects;

DROP POLICY IF EXISTS "Users can read their own legacy slides" ON storage.objects;
CREATE POLICY "Users can read their own legacy slides"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'slides'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
