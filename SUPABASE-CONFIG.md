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

## 📝 Resumo

Para fazer login funcionar:

1. **Desenvolvimento**: Desabilite confirmação de e-mail no Supabase
2. **Produção**: Confirme o e-mail recebido
3. **Testes rápidos**: Use o Modo Demo

O código já foi atualizado para mostrar mensagens mais claras sobre o erro!
