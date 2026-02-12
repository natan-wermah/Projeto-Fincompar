-- ============================================
-- Add Shared Transactions - Compartilhamento de transações entre parceiros
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Adicionar coluna shared na tabela transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS shared BOOLEAN DEFAULT false;

-- 2. Política que permite ler transações compartilhadas do parceiro
-- (funciona junto com a política existente de leitura de transações próprias)
CREATE POLICY "Read partner shared transactions" ON public.transactions
  FOR SELECT USING (
    shared = true
    AND payer_id IN (
      SELECT partner_id FROM public.users WHERE id = auth.uid() AND partner_id IS NOT NULL
    )
  );

-- 3. Recarregar schema
NOTIFY pgrst, 'reload schema';

-- Pronto! Agora os usuários podem compartilhar transações com o parceiro.
