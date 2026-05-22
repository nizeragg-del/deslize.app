CREATE TABLE IF NOT EXISTS public.studio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Projeto sem nome',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.studio_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users see own studio projects" ON public.studio_projects;
CREATE POLICY "users see own studio projects"
  ON public.studio_projects FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users insert own studio projects" ON public.studio_projects;
CREATE POLICY "users insert own studio projects"
  ON public.studio_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users update own studio projects" ON public.studio_projects;
CREATE POLICY "users update own studio projects"
  ON public.studio_projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users delete own studio projects" ON public.studio_projects;
CREATE POLICY "users delete own studio projects"
  ON public.studio_projects FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE public.carousels
  ADD COLUMN IF NOT EXISTS studio_project_id UUID REFERENCES public.studio_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS studio_x INTEGER,
  ADD COLUMN IF NOT EXISTS studio_y INTEGER;

CREATE INDEX IF NOT EXISTS idx_studio_projects_user_created
  ON public.studio_projects(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_carousels_studio_project
  ON public.carousels(studio_project_id, created_at);
