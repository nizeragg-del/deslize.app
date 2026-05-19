-- Habilitar RLS para credit_transactions caso ainda não esteja habilitado
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Permite ao usuário logado inserir suas próprias transações de crédito
DROP POLICY IF EXISTS "users can insert own transactions" ON public.credit_transactions;
CREATE POLICY "users can insert own transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permite ao usuário logado visualizar suas próprias transações de crédito
DROP POLICY IF EXISTS "users can see own transactions" ON public.credit_transactions;
CREATE POLICY "users can see own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);
