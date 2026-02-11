-- ============================================
-- Setup Avatars Storage - Bucket para fotos de perfil
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Criar bucket publico para avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Politica: qualquer usuario logado pode fazer upload do proprio avatar
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Politica: qualquer usuario logado pode atualizar seu avatar
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Politica: qualquer pessoa pode ver avatars (bucket publico)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- 5. Politica: usuarios podem deletar seu proprio avatar
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Pronto! Bucket 'avatars' criado.
-- Os avatars ficam em: avatars/{user_id}/avatar.jpg
