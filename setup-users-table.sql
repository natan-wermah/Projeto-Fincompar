-- ============================================
-- Setup Users Table - Perfil público dos usuários
-- Execute no Supabase SQL Editor
-- ============================================

-- 0. Remover politicas antigas que causam recursao
DROP POLICY IF EXISTS "Partners can view each other" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- 1. Criar tabela de perfis (espelha auth.users com dados extras)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  partner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Politicas RLS (sem recursao!)
-- Qualquer usuario logado pode ver perfis (nome, email, avatar - nada sensivel)
CREATE POLICY "Authenticated users can view profiles" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Cada usuario so pode editar seu proprio perfil
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Cada usuario so pode inserir seu proprio perfil
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Trigger para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Popular com usuarios que ja existem no auth.users
INSERT INTO public.users (id, name, email, avatar)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  email,
  NULL
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 6. Recarregar schema
NOTIFY pgrst, 'reload schema';

-- Pronto! Tabela users criada e populada.
-- Depois execute: setup-partner-invitations.sql
