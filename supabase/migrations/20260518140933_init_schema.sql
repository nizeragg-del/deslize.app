-- Usuários (estende auth.users do Supabase)
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  plan        TEXT NOT NULL DEFAULT 'free', -- free | starter | pro | agency
  credits     INTEGER NOT NULL DEFAULT 1,   -- começa com 1 geração grátis
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Marcas (brand kits) do usuário
CREATE TABLE public.brands (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,               -- nome da empresa
  logo_url    TEXT,                        -- upload no Supabase Storage
  primary_color   TEXT NOT NULL DEFAULT '#7C3AED',
  secondary_color TEXT NOT NULL DEFAULT '#06B6D4',
  bg_color        TEXT NOT NULL DEFAULT '#0A0A0F',
  font_display    TEXT NOT NULL DEFAULT 'Syne',
  font_body       TEXT NOT NULL DEFAULT 'DM Sans',
  tagline         TEXT,
  tone            TEXT DEFAULT 'profissional', -- profissional | descontraído | urgente
  is_default  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Carrosséis gerados
CREATE TABLE public.carousels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id    UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  topic       TEXT NOT NULL,              -- tema informado pelo usuário
  format      TEXT NOT NULL DEFAULT 'standard', -- standard | listicle | tutorial | comparison
  slide_count INTEGER NOT NULL DEFAULT 7,
  html_content TEXT,                      -- HTML gerado pela IA
  status      TEXT NOT NULL DEFAULT 'draft', -- draft | generating | ready | error
  credits_used INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Slides exportados (PNGs)
CREATE TABLE public.slides (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carousel_id UUID NOT NULL REFERENCES public.carousels(id) ON DELETE CASCADE,
  slide_index INTEGER NOT NULL,           -- 0-based
  storage_path TEXT NOT NULL,            -- caminho no Supabase Storage
  width       INTEGER DEFAULT 1080,
  height      INTEGER DEFAULT 1350,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de transações de créditos
CREATE TABLE public.credit_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,           -- positivo = adição, negativo = consumo
  reason      TEXT NOT NULL,             -- 'plan_upgrade' | 'carousel_generation' | 'refund'
  carousel_id UUID REFERENCES public.carousels(id),
  stripe_session_id TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (segurança row-level)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "users see own brands" ON public.brands FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users see own carousels" ON public.carousels FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users see own slides" ON public.slides FOR ALL
  USING (auth.uid() = (SELECT user_id FROM carousels WHERE id = carousel_id));
