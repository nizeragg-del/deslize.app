-- Adiciona colunas para favoritos e pastas/coleções nos carrosséis
ALTER TABLE public.carousels ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.carousels ADD COLUMN IF NOT EXISTS folder_name TEXT DEFAULT NULL;

-- Cria índices para busca eficiente
CREATE INDEX IF NOT EXISTS idx_carousels_user_favorite ON public.carousels(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_carousels_user_folder ON public.carousels(user_id, folder_name);
