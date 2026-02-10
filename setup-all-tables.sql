-- ============================================
-- SETUP COMPLETO - Todas as Tabelas do Fincompar
-- Execute este SQL APENAS UMA VEZ no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABELA USERS
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  partner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. TABELA TRANSACTIONS
-- ============================================

DROP TABLE IF EXISTS public.transactions CASCADE;

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    -- Categorias de Gastos
    'Alimentação', 'Moradia', 'Lazer', 'Transporte', 'Saúde', 'Educação', 'Outros',
    -- Categorias de Ganhos
    'Trabalho Principal', 'Clientes', 'Freelas'
  )),
  payer_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_payer_id ON public.transactions(payer_id);
CREATE INDEX idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = payer_id);

CREATE POLICY "Users can insert their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = payer_id);

CREATE POLICY "Users can update their own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = payer_id);

CREATE POLICY "Users can delete their own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = payer_id);

-- ============================================
-- 3. TABELA GOALS
-- ============================================

DROP TABLE IF EXISTS public.goals CASCADE;

CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_amount NUMERIC(10, 2) NOT NULL,
  current_amount NUMERIC(10, 2) DEFAULT 0,
  contributions JSONB DEFAULT '{}',
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_created_at ON public.goals(created_at DESC);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view goals they contribute to" ON public.goals
  FOR SELECT USING (contributions ? auth.uid()::text);

CREATE POLICY "Users can insert goals" ON public.goals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update goals they contribute to" ON public.goals
  FOR UPDATE USING (contributions ? auth.uid()::text);

CREATE POLICY "Users can delete goals they contribute to" ON public.goals
  FOR DELETE USING (contributions ? auth.uid()::text);

-- ============================================
-- 4. TRIGGER - Criar perfil automático
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
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. RECARREGAR CACHE
-- ============================================

NOTIFY pgrst, 'reload schema';

-- ============================================
-- ✅ SETUP COMPLETO!
-- ============================================

-- Tabelas criadas:
--  ✅ users (perfis de usuários)
--  ✅ transactions (transações financeiras)
--  ✅ goals (metas financeiras)
--  ✅ Trigger automático para criar perfil
--  ✅ Políticas RLS para segurança
--  ✅ Índices para performance
