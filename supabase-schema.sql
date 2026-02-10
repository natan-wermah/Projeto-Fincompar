-- ============================================
-- Fincompar Database Schema
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Tabela de Usuários (users)
-- Estende a tabela auth.users do Supabase
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  partner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Transações (transactions)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Alimentação', 'Moradia', 'Lazer', 'Transporte', 'Saúde', 'Educação', 'Outros')),
  payer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Metas (goals)
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_amount NUMERIC(10, 2) NOT NULL,
  current_amount NUMERIC(10, 2) DEFAULT 0,
  contributions JSONB DEFAULT '{}',
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Índices para melhorar performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_transactions_payer_id ON public.transactions(payer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_created_at ON public.goals(created_at DESC);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Políticas para Users
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Políticas para Transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = payer_id OR auth.uid() IN (
    SELECT partner_id FROM public.users WHERE id = payer_id
  ));

CREATE POLICY "Users can insert their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = payer_id);

CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = payer_id);

CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = payer_id);

-- Políticas para Goals
CREATE POLICY "Users can view goals they contribute to"
  ON public.goals FOR SELECT
  USING (contributions ? auth.uid()::text);

CREATE POLICY "Users can insert goals"
  ON public.goals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update goals they contribute to"
  ON public.goals FOR UPDATE
  USING (contributions ? auth.uid()::text);

CREATE POLICY "Users can delete goals they contribute to"
  ON public.goals FOR DELETE
  USING (contributions ? auth.uid()::text);

-- ============================================
-- Trigger para criar perfil de usuário após signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Dados de teste (opcional - remover em produção)
-- ============================================

-- Você pode adicionar dados de teste aqui se quiser
-- Mas lembre-se de remover antes de ir para produção!
