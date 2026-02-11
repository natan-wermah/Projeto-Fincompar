-- ============================================
-- Fix Goals Table - Metas compartilhadas entre casal
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Deletar tabela antiga
DROP TABLE IF EXISTS public.goals CASCADE;

-- 2. Criar tabela goals com estrutura correta
-- contributions JSONB guarda os IDs de ambos os parceiros como chaves
-- Ex: { "uuid-user-1": 150.00, "uuid-user-2": 200.00 }
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_amount NUMERIC(10, 2) NOT NULL,
  current_amount NUMERIC(10, 2) DEFAULT 0,
  contributions JSONB DEFAULT '{}',
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar índices
CREATE INDEX idx_goals_created_at ON public.goals(created_at DESC);

-- 4. Habilitar RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS (compartilhadas via contributions)
-- Se o user ID estiver como chave no JSONB, ele tem acesso
-- Como ambos os parceiros são adicionados ao criar a meta,
-- os dois conseguem ver/editar/deletar as mesmas metas

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

-- 6. Recarregar schema cache
NOTIFY pgrst, 'reload schema';

-- Pronto! Tabela goals recriada com suporte a metas compartilhadas.
