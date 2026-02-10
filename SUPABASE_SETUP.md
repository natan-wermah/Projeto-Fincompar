# 🗄️ Configuração do Banco de Dados Supabase

Este guia vai te ajudar a criar as tabelas necessárias no Supabase para o Fincompar funcionar corretamente.

## ⚠️ Problema Atual

Se você está vendo este erro:
```
Could not find the 'createdAt' column of 'transactions' in the schema cache
```

É porque as **tabelas ainda não foram criadas** no Supabase!

---

## 📋 Passo a Passo

### 1️⃣ Acessar o Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login
3. Selecione seu projeto **Fincompar** (ou o nome que você deu)

### 2️⃣ Abrir o SQL Editor

1. No menu lateral, clique em **SQL Editor**
2. Clique em **+ New Query** (ou "Nova consulta")

### 3️⃣ Copiar e Colar o SQL

1. Abra o arquivo **[supabase-schema.sql](supabase-schema.sql)** deste repositório
2. **Copie TODO o conteúdo** do arquivo
3. **Cole** no SQL Editor do Supabase

### 4️⃣ Executar o SQL

1. Clique no botão **Run** (ou pressione `Ctrl+Enter`)
2. Aguarde a execução (pode demorar 5-10 segundos)
3. Você deve ver uma mensagem de sucesso ✅

### 5️⃣ Verificar Tabelas

1. No menu lateral, clique em **Table Editor**
2. Você deve ver 3 tabelas criadas:
   - ✅ `users`
   - ✅ `transactions`
   - ✅ `goals`

---

## 🎯 O que foi criado?

### Tabela: `users`
Armazena perfis de usuários:
- `id` - UUID do usuário (vinculado ao auth.users)
- `name` - Nome do usuário
- `email` - Email
- `partner_id` - ID do parceiro (se houver)
- `avatar` - URL do avatar
- `created_at` - Data de criação

### Tabela: `transactions`
Armazena transações financeiras:
- `id` - ID único da transação
- `amount` - Valor (decimal)
- `description` - Descrição
- `date` - Data da transação
- `category` - Categoria (Alimentação, Moradia, etc.)
- `payer_id` - Quem pagou (referência ao user)
- `type` - Tipo: 'income' ou 'expense'
- `created_at` - Quando foi registrada

### Tabela: `goals`
Armazena metas financeiras:
- `id` - ID único da meta
- `name` - Nome da meta
- `target_amount` - Valor alvo
- `current_amount` - Valor atual
- `contributions` - JSON com contribuições de cada parceiro
- `deadline` - Prazo (opcional)
- `created_at` - Data de criação

---

## 🔒 Segurança (RLS)

O SQL também configurou **Row Level Security (RLS)**:

- ✅ Usuários só podem ver suas próprias transações
- ✅ Parceiros podem ver transações um do outro
- ✅ Cada usuário só pode editar seus próprios dados
- ✅ Proteção contra acesso não autorizado

---

## 🤖 Trigger Automático

Foi criado um **trigger** que:
- Quando um novo usuário se cadastra (auth.users)
- Automaticamente cria um perfil na tabela `users`
- Com nome, email e avatar padrão

---

## 🧪 Testar

Depois de executar o SQL:

1. Acesse [fincompar.com.br](https://www.fincompar.com.br/)
2. Use o **Modo Demo** OU crie uma conta (aguarde 1h se tiver rate limit)
3. Tente adicionar uma transação
4. Deve funcionar sem erros! ✅

---

## ❓ Problemas Comuns

### Erro: "relation already exists"
- As tabelas já foram criadas
- Você pode ignorar ou deletar as tabelas antigas primeiro

### Erro: "permission denied"
- Você precisa ser **owner** do projeto Supabase
- Verifique se está logado na conta certa

### Tabelas não aparecem
- Recarregue a página do Supabase
- Verifique se o SQL executou sem erros

### RLS bloqueando inserções
- Certifique-se de estar autenticado
- O `payer_id` deve ser igual ao `auth.uid()` do usuário logado

---

## 🔄 Resetar Tudo (se necessário)

Se quiser deletar tudo e recomeçar:

```sql
-- CUIDADO: Isso deleta TODOS os dados!
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
```

Depois execute o [supabase-schema.sql](supabase-schema.sql) novamente.

---

## 📚 Referências

- [Supabase Table Editor](https://supabase.com/docs/guides/database/tables)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [SQL Editor](https://supabase.com/docs/guides/database/overview)

---

Precisa de ajuda? Abra uma issue no repositório! 🚀
