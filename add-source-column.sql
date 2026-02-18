-- ============================================
-- Adicionar coluna source (origem da transação)
-- Execute no Supabase SQL Editor
-- ============================================

-- Adicionar coluna de origem (manual ou pluggy)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Recarregar schema cache
NOTIFY pgrst, 'reload schema';
