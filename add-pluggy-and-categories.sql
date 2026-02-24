-- ============================================
-- Add pluggy_item_id and custom_categories to users table
-- Permite sincronizar banco conectado entre dispositivos e categorias customizadas
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Adicionar pluggy_item_id para persistência cross-device da conexão bancária
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS pluggy_item_id TEXT;

-- 2. Adicionar custom_categories para categorias personalizadas por usuário
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS custom_categories JSONB DEFAULT '{"expense":[],"income":[],"investment":[]}';

-- 3. Recarregar schema
NOTIFY pgrst, 'reload schema';
