# Configuração do Supabase - Fincompar

## Problema: Não consigo fazer login após cadastro

Por padrão, o Supabase **exige confirmação de e-mail** antes de permitir login. Existem duas soluções:

---

## ✅ Solução 1: Confirmar o E-mail (Recomendado para Produção)

1. Após criar a conta, acesse sua caixa de e-mail
2. Procure o e-mail de confirmação do Supabase
3. Clique no link de confirmação
4. Agora você pode fazer login normalmente

**Obs:** Verifique também a pasta de SPAM!

---

## 🔧 Solução 2: Desabilitar Confirmação de E-mail (Apenas para Desenvolvimento)

Se você está em **modo de desenvolvimento** e quer testar sem confirmação de e-mail:

### Passos no Supabase Dashboard:

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Authentication** → **Settings** (Autenticação → Configurações)
4. Role até **Email Auth** (Autenticação por E-mail)
5. **DESMARQUE** a opção:
   - ☐ **Enable email confirmations** (Habilitar confirmações de e-mail)
6. Clique em **Save** (Salvar)

### Resultado:

- Novos usuários poderão fazer login **imediatamente** após cadastro
- Não será necessário confirmar e-mail

### ⚠️ IMPORTANTE:

- **NÃO use isso em produção!**
- Confirmação de e-mail é importante para segurança
- Use apenas para testes de desenvolvimento

---

## 🎯 Solução 3: Usar Modo Demo

Se não quiser lidar com autenticação agora:

1. Na tela de login, clique em **"Entrar em Modo Demo"**
2. Teste todas as funcionalidades sem criar conta
3. Dados não serão salvos (apenas local)

---

## 🔍 Como Verificar o Erro

O sistema agora mostra mensagens mais claras:

- 📧 **"Confirme seu e-mail antes de fazer login!"** → Precisa confirmar e-mail
- ❌ **"E-mail ou senha incorretos"** → Credenciais inválidas
- ⏱️ **"Muitas tentativas de login"** → Rate limit do Supabase

---

## 🛠️ Configurações Adicionais Recomendadas

### 1. Configurar URL de Redirecionamento

No Supabase Dashboard:
- **Authentication** → **URL Configuration**
- Adicione a URL do seu app em **Redirect URLs**:
  ```
  http://localhost:5173
  http://localhost:5173/
  ```

### 2. Verificar Políticas RLS

Certifique-se de que as políticas de segurança estão ativas:
```sql
-- Verificar no SQL Editor
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

Deve mostrar políticas para:
- users
- transactions
- goals
- investments

---

## 📧 E-mail Não Está Chegando?

### Por que isso acontece:

O Supabase **não envia e-mails por padrão**. Ele precisa de configuração SMTP!

### Solução 1: Desabilitar Confirmação (RECOMENDADO para DEV)

**Passo a passo detalhado:**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **Authentication** → **Providers** (ou **Email**)
4. Procure por: **"Confirm email"** ou **"Enable email confirmations"**
5. **DESMARQUE** essa opção: ☐ Enable email confirmations
6. Scroll até o final e clique em **"Save"**
7. Pronto! Agora pode criar conta e logar imediatamente

**Ou acesse diretamente:**
```
https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/auth/providers
```

### Solução 2: Configurar SMTP (Para PRODUÇÃO)

Se você quer **realmente enviar e-mails**, configure um provedor SMTP:

#### Opção A: Gmail (Grátis)

1. No Supabase: **Settings** → **Auth** → **SMTP Settings**
2. Configure:
   - **Host:** smtp.gmail.com
   - **Port:** 587
   - **User:** seu-email@gmail.com
   - **Password:** [senha de app - veja abaixo]
   - **Sender:** seu-email@gmail.com

3. **Criar Senha de App no Gmail:**
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "Mail" e seu dispositivo
   - Copie a senha gerada
   - Use essa senha no SMTP Password

#### Opção B: SendGrid (100 emails/dia grátis)

1. Crie conta: https://sendgrid.com/free
2. Crie uma API Key em Settings → API Keys
3. Configure no Supabase:
   - **Host:** smtp.sendgrid.net
   - **Port:** 587
   - **User:** apikey
   - **Password:** [sua API key do SendGrid]

#### Opção C: Resend (Mais moderno)

1. Crie conta: https://resend.com
2. Pegue sua API Key
3. Configure no Supabase com os dados do Resend

#### Opção D: Mailtrap (Apenas para TESTES)

1. Crie conta: https://mailtrap.io
2. Pegue as credenciais SMTP da inbox de teste
3. Configure no Supabase
4. E-mails irão para o Mailtrap, não para caixa real

---

## 📝 Resumo

Para fazer login funcionar:

1. **Desenvolvimento**: Desabilite confirmação de e-mail no Supabase ✅
2. **Produção**: Configure SMTP + Confirmação de e-mail
3. **Testes rápidos**: Use o Modo Demo

O código já foi atualizado para mostrar mensagens mais claras sobre o erro!

---

## 🎯 Checklist Rápido

- [ ] Desabilitei confirmação de e-mail no Supabase
- [ ] Criei nova conta de teste
- [ ] Consegui fazer login sem confirmar e-mail
- [ ] Tudo funcionando! 🎉

OU (para produção):

- [ ] Configurei SMTP (Gmail, SendGrid, etc)
- [ ] Testei envio de e-mail
- [ ] E-mail chegou na caixa de entrada
- [ ] Confirmei e-mail e fiz login
- [ ] Tudo funcionando! 🎉
