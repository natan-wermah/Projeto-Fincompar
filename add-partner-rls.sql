-- ============================================
-- Fix Partner Transactions RLS
-- Permite que parceiros vejam TODAS as transações um do outro (não apenas shared=true)
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Remover policy antiga que exigia shared=true
DROP POLICY IF EXISTS "Read partner shared transactions" ON public.transactions;

-- 2. Nova policy: parceiro pode ver TODAS as transações do parceiro vinculado
CREATE POLICY "Partners can read each other transactions" ON public.transactions
  FOR SELECT USING (
    payer_id IN (
      SELECT partner_id FROM public.users
      WHERE id = auth.uid() AND partner_id IS NOT NULL
    )
  );

-- 3. Recarregar schema
NOTIFY pgrst, 'reload schema';
