-- ============================================
-- Setup Partner Invitations - Sistema de convites de casal
-- IMPORTANTE: Execute setup-users-table.sql ANTES deste arquivo!
-- Execute no Supabase SQL Editor
-- ============================================

-- 0. Remover tabela e politicas antigas (caso ja tenha executado antes)
DROP TABLE IF EXISTS public.partner_invitations CASCADE;

-- 1. Criar tabela de convites
CREATE TABLE public.partner_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  receiver_email TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indices para performance
CREATE INDEX idx_invitations_receiver_email ON public.partner_invitations(receiver_email);
CREATE INDEX idx_invitations_sender_id ON public.partner_invitations(sender_id);
CREATE INDEX idx_invitations_status ON public.partner_invitations(status);

-- 3. Habilitar RLS
ALTER TABLE public.partner_invitations ENABLE ROW LEVEL SECURITY;

-- 4. Politicas RLS
-- IMPORTANTE: Usar auth.email() em vez de SELECT em auth.users
-- O role 'authenticated' nao tem permissao para acessar auth.users diretamente

-- Quem enviou pode ver seus convites
CREATE POLICY "Users can view invitations they sent"
  ON public.partner_invitations FOR SELECT
  USING (sender_id = auth.uid());

-- Quem recebeu pode ver convites para seu email
CREATE POLICY "Users can view invitations sent to them"
  ON public.partner_invitations FOR SELECT
  USING (receiver_email = auth.email());

-- Usuarios logados podem enviar convites
CREATE POLICY "Users can send invitations"
  ON public.partner_invitations FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Quem recebeu pode atualizar (aceitar/rejeitar)
CREATE POLICY "Receivers can update invitation status"
  ON public.partner_invitations FOR UPDATE
  USING (receiver_email = auth.email());

-- Quem enviou pode cancelar (deletar)
CREATE POLICY "Senders can delete their invitations"
  ON public.partner_invitations FOR DELETE
  USING (sender_id = auth.uid());

-- 5. Funcao para aceitar convite e vincular parceiros
-- Usa SECURITY DEFINER para ter permissao de acessar auth.users
DROP FUNCTION IF EXISTS public.accept_partner_invitation(UUID);

CREATE OR REPLACE FUNCTION public.accept_partner_invitation(invitation_id UUID)
RETURNS VOID AS $$
DECLARE
  inv RECORD;
  receiver_user_id UUID;
  receiver_email_addr TEXT;
BEGIN
  -- Buscar o convite
  SELECT * INTO inv FROM public.partner_invitations WHERE id = invitation_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite nao encontrado ou ja processado';
  END IF;

  -- Buscar ID e email do receptor
  receiver_user_id := auth.uid();
  receiver_email_addr := auth.email();

  -- Verificar que o receptor e quem ta aceitando
  IF inv.receiver_email != receiver_email_addr THEN
    RAISE EXCEPTION 'Voce nao pode aceitar este convite';
  END IF;

  -- Vincular os dois usuarios
  UPDATE public.users SET partner_id = receiver_user_id WHERE id = inv.sender_id;
  UPDATE public.users SET partner_id = inv.sender_id WHERE id = receiver_user_id;

  -- Marcar convite como aceito
  UPDATE public.partner_invitations SET status = 'accepted', updated_at = NOW() WHERE id = invitation_id;

  -- Rejeitar outros convites pendentes de ambos
  UPDATE public.partner_invitations SET status = 'rejected', updated_at = NOW()
  WHERE id != invitation_id AND status = 'pending'
  AND (sender_id = inv.sender_id OR sender_id = receiver_user_id
       OR receiver_email = inv.receiver_email
       OR receiver_email = inv.sender_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recarregar schema
NOTIFY pgrst, 'reload schema';

-- Pronto! Sistema de convites de casal configurado.
-- Execute este script INTEIRO no SQL Editor do Supabase.
