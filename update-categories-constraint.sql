-- ============================================
-- Atualizar Constraint de Categorias
-- Execute no Supabase SQL Editor
-- ============================================

-- Remove constraint antiga
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_category_check;

-- Adiciona nova constraint com categorias de Gastos E Ganhos
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_category_check
CHECK (category IN (
  -- Categorias de Gastos
  'Alimentação',
  'Moradia',
  'Lazer',
  'Transporte',
  'Saúde',
  'Educação',
  'Outros',
  -- Categorias de Ganhos
  'Trabalho Principal',
  'Clientes',
  'Freelas'
));

-- Recarregar schema cache
NOTIFY pgrst, 'reload schema';

-- ✅ Pronto! Agora aceita todas as categorias (gastos e ganhos)
