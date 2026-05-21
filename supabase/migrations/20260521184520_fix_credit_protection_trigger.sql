-- Allow trusted server-side credit mutations while keeping client profile edits
-- from changing credits, plans, or Stripe identifiers.

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('app.profile_system_update', TRUE) = 'true'
     OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    NEW.plan := OLD.plan;
  END IF;

  IF NEW.credits IS DISTINCT FROM OLD.credits THEN
    NEW.credits := OLD.credits;
  END IF;

  IF NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id THEN
    NEW.stripe_customer_id := OLD.stripe_customer_id;
  END IF;

  IF NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id THEN
    NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.consume_credit(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'carousel_generation',
  p_carousel_id UUID DEFAULT NULL
)
RETURNS TABLE(new_credits INTEGER, transaction_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_credits INTEGER;
  v_transaction_id UUID;
BEGIN
  PERFORM set_config('app.profile_system_update', 'true', TRUE);

  UPDATE public.profiles
  SET credits = credits - 1,
      updated_at = NOW()
  WHERE id = p_user_id
    AND credits > 0
  RETURNING credits INTO v_new_credits;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient_credits' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, reason, carousel_id)
  VALUES (p_user_id, -1, p_reason, p_carousel_id)
  RETURNING id INTO v_transaction_id;

  RETURN QUERY SELECT v_new_credits, v_transaction_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_credit(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'generation_refund'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_credits INTEGER;
BEGIN
  PERFORM set_config('app.profile_system_update', 'true', TRUE);

  UPDATE public.profiles
  SET credits = credits + 1,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits INTO v_new_credits;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, reason)
  VALUES (p_user_id, 1, p_reason);

  RETURN v_new_credits;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_onboarding_bonus()
RETURNS TABLE(new_credits INTEGER, bonus_claimed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_new_credits INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.brands WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'brand_required' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.carousels WHERE user_id = v_user_id AND status = 'ready') THEN
    RAISE EXCEPTION 'carousel_required' USING ERRCODE = 'P0001';
  END IF;

  PERFORM set_config('app.profile_system_update', 'true', TRUE);

  UPDATE public.profiles
  SET credits = credits + 1,
      onboarding_bonus_claimed = TRUE,
      updated_at = NOW()
  WHERE id = v_user_id
    AND onboarding_bonus_claimed = FALSE
  RETURNING credits INTO v_new_credits;

  IF NOT FOUND THEN
    SELECT credits INTO v_new_credits
    FROM public.profiles
    WHERE id = v_user_id;

    RETURN QUERY SELECT COALESCE(v_new_credits, 0), TRUE;
    RETURN;
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, reason)
  VALUES (v_user_id, 1, 'onboarding_bonus');

  RETURN QUERY SELECT v_new_credits, TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_credit(UUID, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_credit(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_onboarding_bonus() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.claim_onboarding_bonus() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_credit(UUID, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_credit(UUID, TEXT) TO service_role;
