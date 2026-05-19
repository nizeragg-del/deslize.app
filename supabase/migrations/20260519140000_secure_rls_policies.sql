-- Secure Profiles table: users can only SELECT their own profiles.
-- We drop the FOR ALL policy which allowed Mass Assignment vulnerabilities.
DROP POLICY IF EXISTS "users see own profile" ON public.profiles;
CREATE POLICY "users see own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Secure Brands table: specific policies to enforce WITH CHECK
DROP POLICY IF EXISTS "users see own brands" ON public.brands;
CREATE POLICY "users see own brands" ON public.brands FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own brands" ON public.brands FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own brands" ON public.brands FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own brands" ON public.brands FOR DELETE USING (auth.uid() = user_id);

-- Secure Carousels table: specific policies to enforce WITH CHECK
DROP POLICY IF EXISTS "users see own carousels" ON public.carousels;
CREATE POLICY "users see own carousels" ON public.carousels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own carousels" ON public.carousels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own carousels" ON public.carousels FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own carousels" ON public.carousels FOR DELETE USING (auth.uid() = user_id);

-- Secure Slides table: specific policies to enforce WITH CHECK
DROP POLICY IF EXISTS "users see own slides" ON public.slides;
CREATE POLICY "users see own slides" ON public.slides FOR SELECT USING (auth.uid() = (SELECT user_id FROM carousels WHERE id = carousel_id));
CREATE POLICY "users insert own slides" ON public.slides FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM carousels WHERE id = carousel_id));
CREATE POLICY "users update own slides" ON public.slides FOR UPDATE USING (auth.uid() = (SELECT user_id FROM carousels WHERE id = carousel_id)) WITH CHECK (auth.uid() = (SELECT user_id FROM carousels WHERE id = carousel_id));
CREATE POLICY "users delete own slides" ON public.slides FOR DELETE USING (auth.uid() = (SELECT user_id FROM carousels WHERE id = carousel_id));
