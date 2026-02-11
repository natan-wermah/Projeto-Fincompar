-- ============================================
-- TABELA DE INVESTIMENTOS - Fincompar
-- Execute este SQL no Supabase SQL Editor
-- ============================================

DROP TABLE IF EXISTS public.investments CASCADE;

CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL, -- Nome do ativo (PETR4, Bitcoin, Tesouro Selic, etc)
  category TEXT NOT NULL CHECK (category IN (
    'Ações', 'FII', 'ETF', 'Cripto', 'Renda Fixa', 'Tesouro Direto', 'CDB', 'LCI/LCA', 'Fundos', 'Outros'
  )),
  platform TEXT NOT NULL, -- XP, Rico, Binance, NuInvest, etc
  quantity NUMERIC(10, 4), -- Quantidade de cotas/ações (opcional)
  date DATE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_investments_user_id ON public.investments(user_id);
CREATE INDEX idx_investments_date ON public.investments(date DESC);
CREATE INDEX idx_investments_description ON public.investments(description);
CREATE INDEX idx_investments_category ON public.investments(category);
CREATE INDEX idx_investments_created_at ON public.investments(created_at DESC);

-- Row Level Security
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own investments" ON public.investments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investments" ON public.investments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments" ON public.investments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investments" ON public.investments
  FOR DELETE USING (auth.uid() = user_id);

-- Recarregar cache
NOTIFY pgrst, 'reload schema';

-- ============================================
-- ✅ TABELA DE INVESTIMENTOS CRIADA!
-- ============================================
