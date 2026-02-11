-- ============================================
-- CORREÇÃO: Categorias da Tabela Transactions
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Remove o constraint antigo (se existir)
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_category_check;

-- Adiciona o novo constraint com TODAS as categorias
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_category_check
CHECK (category IN (
  -- GASTOS (Expenses)
  'Alimentação',
  'Moradia',
  'Lazer',
  'Transporte',
  'Saúde',
  'Educação',
  'Cartão',
  'Outros',
  -- GANHOS (Income)
  'Trabalho Principal',
  'Clientes',
  'Freelas'
));

-- Recarregar cache
NOTIFY pgrst, 'reload schema';

-- ============================================
-- ✅ CONSTRAINT DE CATEGORIAS ATUALIZADO!
-- ============================================
