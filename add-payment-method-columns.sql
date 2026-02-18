-- ============================================
-- Adicionar colunas payment_method e is_refund
-- Execute no Supabase SQL Editor
-- ============================================

-- Adicionar coluna de método de pagamento
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'other';

-- Adicionar coluna de estorno
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS is_refund BOOLEAN DEFAULT false;

-- Recarregar schema cache
NOTIFY pgrst, 'reload schema';
