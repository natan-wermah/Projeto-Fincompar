-- ============================================
-- Setup Users Table - Perfil público dos usuários
-- Execute no Supabase SQL Editor
-- ============================================

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

-- 3. Políticas RLS
-- Cada usuario pode ver seu proprio perfil
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own profile' AND tablename = 'users') THEN
    CREATE POLICY "Users can view their own profile" ON public.users
      FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

-- Cada usuario pode atualizar seu proprio perfil
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile' AND tablename = 'users') THEN
    CREATE POLICY "Users can update their own profile" ON public.users
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Cada usuario pode inserir seu proprio perfil
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profile' AND tablename = 'users') THEN
    CREATE POLICY "Users can insert their own profile" ON public.users
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Parceiros podem ver o perfil um do outro
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Partners can view each other' AND tablename = 'users') THEN
    CREATE POLICY "Partners can view each other" ON public.users
      FOR SELECT USING (
        id IN (SELECT partner_id FROM public.users WHERE id = auth.uid())
      );
  END IF;
END $$;

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

-- Pronto! Tabela users criada e populada com usuarios existentes.
