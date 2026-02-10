# 🚀 Configuração do Projeto Fincompar

## Pré-requisitos

- Node.js 18+ instalado
- Conta no [Supabase](https://supabase.com)
- Chave de API do [Google AI Studio](https://makersuite.google.com/app/apikey)

## Configuração das Variáveis de Ambiente

1. Renomeie o arquivo `.env.local` ou crie um novo com as seguintes variáveis:

```env
# Google AI (Gemini)
GEMINI_API_KEY=sua_chave_api_aqui

# Supabase
VITE_SUPABASE_URL=https://npwasjczhjqcltdanegx.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

2. **Obter Chave do Gemini:**
   - Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Faça login com sua conta Google
   - Clique em "Get API Key"
   - Copie a chave e cole no `.env.local`

3. **Configurar Supabase:**
   - Já configurado com as credenciais do projeto
   - Se quiser usar seu próprio projeto Supabase:
     - Acesse [Supabase Dashboard](https://app.supabase.com)
     - Crie um novo projeto
     - Copie a URL e a chave anônima em Settings > API
     - Cole no `.env.local`

## Estrutura do Banco de Dados (Supabase)

Crie as seguintes tabelas no Supabase SQL Editor:

```sql
-- Tabela de usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  partner_id UUID REFERENCES users(id),
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  payer_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de metas
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  contributions JSONB DEFAULT '{}'::jsonb,
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança (exemplos básicos)
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view their transactions" ON transactions
  FOR SELECT USING (auth.uid() = payer_id);

CREATE POLICY "Users can insert their transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = payer_id);

CREATE POLICY "Users can view their goals" ON goals
  FOR SELECT USING (contributions ? auth.uid()::text);

CREATE POLICY "Users can insert goals" ON goals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their goals" ON goals
  FOR UPDATE USING (contributions ? auth.uid()::text);
```

## Instalação

```bash
npm install
```

## Executar o Projeto

```bash
npm run dev
```

O projeto estará disponível em: `http://localhost:3000`

## Build para Produção

```bash
npm run build
npm run preview
```

## Funcionalidades Implementadas

✅ Sistema de autenticação com Supabase
✅ Notificações toast (substituindo alerts)
✅ Validações de input em todos os formulários
✅ Persistência de dados no Supabase
✅ Debounce nas chamadas da API do Gemini
✅ Geração de IDs seguros com crypto.randomUUID()
✅ Acessibilidade (aria-labels em todos os elementos interativos)
✅ Funcionalidade completa de adicionar metas
✅ Sistema de tipos TypeScript melhorado

## Melhorias de Segurança

- ✅ Credenciais movidas para variáveis de ambiente
- ✅ Validação de inputs do lado do cliente
- ✅ Uso de prepared statements no Supabase
- ✅ Row Level Security (RLS) no banco de dados

## Próximos Passos Sugeridos

- [ ] Implementar funcionalidade de "Esqueci a senha"
- [ ] Adicionar login social (Google/Facebook)
- [ ] Implementar gráficos de gastos
- [ ] Adicionar notificações push
- [ ] Criar testes unitários e de integração
- [ ] Implementar PWA (Progressive Web App)
- [ ] Adicionar suporte offline
- [ ] Criar sistema de categorias personalizadas

## Suporte

Se encontrar problemas, verifique:
1. As variáveis de ambiente estão corretas?
2. O Supabase está configurado corretamente?
3. A chave do Gemini está válida?
4. As tabelas do banco foram criadas?

Para mais ajuda, consulte a documentação:
- [Supabase Docs](https://supabase.com/docs)
- [Google AI Docs](https://ai.google.dev/docs)
- [Vite Docs](https://vitejs.dev/)
