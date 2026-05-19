-- Create the 'slides' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('slides', 'slides', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the 'slides' bucket

-- 1. Allow public access to view slides
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'slides' );

-- 2. Allow authenticated users to upload slides (specifically the edge function via service role or user)
CREATE POLICY "Users can upload their own slides"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'slides' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow users to update their own slides
CREATE POLICY "Users can update their own slides"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'slides' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow users to delete their own slides
CREATE POLICY "Users can delete their own slides"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'slides' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
