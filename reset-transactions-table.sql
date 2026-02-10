-- ============================================
-- RESET da Tabela Transactions
-- Execute apenas se houver problemas com a estrutura
-- ============================================

-- 1. Deletar tabela antiga (CUIDADO: perde todos os dados!)
DROP TABLE IF EXISTS public.transactions CASCADE;

-- 2. Recriar tabela com estrutura correta
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Alimentação', 'Moradia', 'Lazer', 'Transporte', 'Saúde', 'Educação', 'Outros')),
  payer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Recriar índices
CREATE INDEX idx_transactions_payer_id ON public.transactions(payer_id);
CREATE INDEX idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- 4. Habilitar RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 5. Recriar políticas
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = payer_id);

DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
CREATE POLICY "Users can insert their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = payer_id);

DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = payer_id);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = payer_id);

-- 6. Recarregar schema cache
NOTIFY pgrst, 'reload schema';

-- ✅ Pronto! Tabela recriada com estrutura correta.
