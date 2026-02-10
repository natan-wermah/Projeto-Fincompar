# 🚀 Deploy na Vercel - Guia Completo

## Passo 1: Preparar o Projeto

Certifique-se de que o código está funcionando localmente:

```bash
npm install
npm run build
npm run preview
```

Se funcionar localmente, prossiga para o deploy.

## Passo 2: Configurar Variáveis de Ambiente na Vercel

**IMPORTANTE:** As variáveis do arquivo `.env.local` NÃO são enviadas para a Vercel automaticamente!

### 2.1 Acessar o Painel da Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**

### 2.2 Adicionar as Variáveis

Adicione as seguintes variáveis (uma por uma):

| Nome | Valor | Ambientes |
|------|-------|-----------|
| `VITE_GEMINI_API_KEY` | Sua chave do Google AI Studio | Production, Preview, Development |
| `VITE_SUPABASE_URL` | `https://npwasjczhjqcltdanegx.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Sua chave anônima do Supabase | Production, Preview, Development |

### 2.3 Como Obter as Chaves

**Google AI (Gemini):**
1. Acesse: https://makersuite.google.com/app/apikey
2. Clique em "Get API Key"
3. Copie a chave

**Supabase:**
- A URL e chave já estão no seu `.env.local`
- Se precisar de novas: https://app.supabase.com → Settings → API

## Passo 3: Deploy

### Opção 1: Deploy via GitHub (Recomendado)

1. Faça push do código para o GitHub:
```bash
git add .
git commit -m "Fix: Corrigir variáveis de ambiente para Vercel"
git push
```

2. Na Vercel:
   - New Project
   - Import do seu repositório GitHub
   - A Vercel detecta automaticamente que é um projeto Vite
   - Clique em "Deploy"

### Opção 2: Deploy via CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

## Passo 4: Verificar o Deploy

Após o deploy:

1. ✅ Acesse a URL fornecida pela Vercel
2. ✅ Abra o Console do navegador (F12)
3. ✅ Verifique se há erros

### Erros Comuns

**Tela Branca?**
- Verifique o Console (F12) → Aba "Console"
- Verifique se as variáveis de ambiente estão configuradas
- Na Vercel: Settings → Environment Variables

**Erro de API do Gemini?**
```
Error: API key not valid
```
→ Sua chave `VITE_GEMINI_API_KEY` está incorreta ou não foi configurada

**Erro do Supabase?**
```
Invalid Supabase URL
```
→ Sua `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` estão incorretas

## Passo 5: Ver Logs em Tempo Real

1. Vá em **Deployments**
2. Clique no deploy mais recente
3. Vá em **Function Logs** ou **Build Logs**

## Comandos Úteis

```bash
# Testar build localmente (igual à Vercel)
npm run build

# Preview do build
npm run preview

# Ver tamanho do bundle
npm run build -- --mode production
```

## Configurações de Build na Vercel

Se a Vercel não detectar automaticamente, use:

| Campo | Valor |
|-------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

## Redeploy Após Mudanças

Se você alterar as variáveis de ambiente:

1. Vá em **Deployments**
2. Clique nos 3 pontos do último deploy
3. **Redeploy**
4. Ou faça um novo commit no GitHub

## Checklist Final

Antes de fazer deploy, certifique-se:

- ✅ `npm run build` funciona localmente sem erros
- ✅ Todas as 3 variáveis de ambiente estão configuradas na Vercel
- ✅ As chaves são válidas (teste localmente primeiro)
- ✅ O arquivo `.env.local` NÃO foi commitado no Git (ele está no .gitignore)
- ✅ O projeto está no GitHub

## Troubleshooting Avançado

### Ver Build Logs

Na Vercel:
1. Deployments → Clique no deploy
2. "Building" → Veja os logs

### Testar Localmente como Produção

```bash
npm run build
npm run preview
```

Abra no navegador e veja se funciona. Se funcionar aqui mas não na Vercel, o problema é nas variáveis de ambiente.

### Cache da Vercel

Se mudou algo mas não aparece:
1. Settings → General
2. Scroll até "Cache"
3. "Clear Build Cache"
4. Redeploy

## Suporte

Se ainda tiver problemas:

1. Verifique os logs de build na Vercel
2. Abra o Console do navegador (F12)
3. Verifique se as variáveis estão definidas:
   - Na Vercel: Settings → Environment Variables
   - Devem estar em **Production** e **Preview**

## URLs Úteis

- Vercel Dashboard: https://vercel.com/dashboard
- Google AI Studio: https://makersuite.google.com/app/apikey
- Supabase Dashboard: https://app.supabase.com
- Documentação Vercel: https://vercel.com/docs
