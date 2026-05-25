-- Split public brand assets from private generated carousel exports.
-- Existing objects in the legacy "slides" bucket are left untouched for compatibility.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'carousel-slides',
  'carousel-slides',
  false,
  10485760,
  ARRAY['image/png']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets',
  'brand-assets',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

ALTER TABLE public.slides
  ADD COLUMN IF NOT EXISTS storage_bucket TEXT NOT NULL DEFAULT 'slides';

DROP POLICY IF EXISTS "Users can read their own private carousel slides" ON storage.objects;
CREATE POLICY "Users can read their own private carousel slides"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'carousel-slides'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can upload their own private carousel slides" ON storage.objects;
CREATE POLICY "Users can upload their own private carousel slides"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'carousel-slides'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own private carousel slides" ON storage.objects;
CREATE POLICY "Users can update their own private carousel slides"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'carousel-slides'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'carousel-slides'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own private carousel slides" ON storage.objects;
CREATE POLICY "Users can delete their own private carousel slides"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'carousel-slides'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Public read brand assets" ON storage.objects;
CREATE POLICY "Public read brand assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-assets');

DROP POLICY IF EXISTS "Users can upload their own brand assets" ON storage.objects;
CREATE POLICY "Users can upload their own brand assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own brand assets" ON storage.objects;
CREATE POLICY "Users can update their own brand assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'brand-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own brand assets" ON storage.objects;
CREATE POLICY "Users can delete their own brand assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Keep sensitive accounting rows server-owned. Users can read their own history.
DROP POLICY IF EXISTS "users can insert own transactions" ON public.credit_transactions;

-- Generated carousel bodies should be created by server routes that consume credits.
-- Users may still organize, favorite and delete their own carousels in the Studio.
DROP POLICY IF EXISTS "users insert own carousels" ON public.carousels;

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_count INTEGER;
  v_reset_at TIMESTAMPTZ;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.api_rate_limits
  WHERE reset_at < v_now - INTERVAL '10 minutes';

  INSERT INTO public.api_rate_limits AS limits (key, count, reset_at)
  VALUES (p_key, 1, v_now + make_interval(secs => p_window_seconds))
  ON CONFLICT (key) DO UPDATE
  SET count = CASE
        WHEN limits.reset_at <= v_now THEN 1
        ELSE limits.count + 1
      END,
      reset_at = CASE
        WHEN limits.reset_at <= v_now THEN v_now + make_interval(secs => p_window_seconds)
        ELSE limits.reset_at
      END
  RETURNING limits.count, limits.reset_at
  INTO v_count, v_reset_at;

  RETURN QUERY SELECT
    v_count <= p_limit,
    GREATEST(p_limit - v_count, 0),
    v_reset_at;
END;
$$;

REVOKE ALL ON FUNCTION public.check_api_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_api_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;

ALTER TABLE public.stripe_webhook_events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'succeeded',
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
