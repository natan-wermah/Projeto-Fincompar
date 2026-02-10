# 🔧 Troubleshooting - Tela Branca na Vercel

## 🎯 PROBLEMA PRINCIPAL RESOLVIDO: Tailwind via CDN

**⚠️ CAUSA RAIZ DA TELA BRANCA:** O projeto estava usando Tailwind via CDN:
```html
<script src="https://cdn.tailwindcss.com"></script>
```

**Por que quebrava na Vercel:**
- CDN lento/bloqueado → React renderiza sem estilos → Tela branca
- Local funcionava (cache), Vercel não

**✅ SOLUÇÃO APLICADA:**
Instalado Tailwind como dependência (não CDN). Ver [PROBLEMA_RESOLVIDO.md](PROBLEMA_RESOLVIDO.md) para detalhes completos.

---

## ✅ Outras Correções Aplicadas

O projeto agora está **protegido contra tela branca** mesmo com variáveis não configuradas:

### 1. Error Boundary
- Captura erros inesperados
- Mostra tela amigável em vez de tela branca
- Botão para recarregar a página

### 2. Validação de Variáveis
- Supabase não quebra mais a aplicação
- Gemini AI opcional (mostra aviso se não configurado)
- Warnings no console em vez de crashes

### 3. Aviso Visual
- Banner amarelo aparece se variáveis não estão configuradas
- Guia o usuário para configurar corretamente

## 🚀 Como Testar Localmente

### 1. Testar sem variáveis configuradas
```bash
# Renomear .env.local temporariamente
mv .env.local .env.local.backup

# Rodar build
npm run build
npm run preview
```

**Resultado esperado:** App carrega, mostra banner amarelo de aviso

### 2. Testar com variáveis configuradas
```bash
# Restaurar .env.local
mv .env.local.backup .env.local

# Build novamente
npm run build
npm run preview
```

**Resultado esperado:** App carrega normalmente, sem avisos

## 🔍 Diagnóstico de Tela Branca

Se ainda tiver tela branca na Vercel, siga estes passos:

### Passo 1: Abrir Console do Navegador
1. Acesse o site na Vercel
2. Pressione `F12` para abrir DevTools
3. Vá em **Console**
4. Procure por erros em vermelho

### Passo 2: Identificar o Erro

#### Erro: "Supabase environment variables"
**Solução:** Configure as variáveis na Vercel

1. Vercel Dashboard → Settings → Environment Variables
2. Adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
3. Redeploy

#### Erro: "Failed to fetch" ou "Network Error"
**Solução:** Problema com API

1. Verifique se as chaves são válidas
2. Teste as chaves localmente primeiro
3. Confirme que não há limite de rate na API

#### Erro: "Module not found" ou "import"
**Solução:** Problema no build

1. Delete `node_modules` e `package-lock.json`
2. Execute `npm install`
3. Execute `npm run build`
4. Commit e push

#### Erro: Página carrega mas fica branca
**Solução:** Problema de JavaScript

1. Verifique se há erros no Console
2. Tente limpar cache: `Ctrl + Shift + R`
3. Teste em modo anônimo do navegador

### Passo 3: Verificar Build Logs

Na Vercel:
1. Deployments → Clique no deploy com problema
2. "Building" → Ver logs completos
3. Procure por erros ou warnings

## 🎯 Checklist de Deploy

Antes de fazer deploy, verifique:

- ✅ `npm run build` funciona localmente
- ✅ `npm run preview` mostra o site funcionando
- ✅ Variáveis de ambiente configuradas na Vercel:
  - `VITE_GEMINI_API_KEY`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- ✅ Marcou **Production**, **Preview**, **Development** nas variáveis
- ✅ Fez redeploy após configurar variáveis

## 🛡️ Proteções Implementadas

### 1. supabaseClient.ts
```typescript
// ANTES (quebrava a aplicação):
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// AGORA (só avisa):
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase not configured')
}
```

### 2. geminiService.ts
```typescript
// Verifica se API key está disponível
if (!ai) {
  return "Configure sua chave da API do Gemini...";
}
```

### 3. ErrorBoundary
- Captura qualquer erro React
- Mostra tela amigável
- Opção de recarregar

### 4. ConfigWarning
- Aviso visual se variáveis não configuradas
- Aparece na parte inferior da tela
- Link para documentação

## 📱 Testar em Produção

Depois do deploy:

1. **Acesse a URL da Vercel**
2. **Abra o Console (F12)**
3. **Verifique:**
   - ✅ Sem erros em vermelho
   - ✅ Banner de aviso aparece (se variáveis não configuradas)
   - ✅ Login funciona (se Supabase configurado)
   - ✅ Análise IA funciona (se Gemini configurado)

## 🔄 Redeploy na Vercel

Se fez mudanças nas variáveis:

### Opção 1: Via Git
```bash
git add .
git commit -m "fix: Variáveis configuradas"
git push
```

### Opção 2: Via Dashboard
1. Deployments
2. Clique nos 3 pontos do último deploy
3. "Redeploy"

### Opção 3: Via CLI
```bash
vercel --prod
```

## 📞 Ainda com Problemas?

1. **Limpe o cache da Vercel:**
   - Settings → General → Clear Build Cache
   - Redeploy

2. **Verifique os logs:**
   - Deployments → Build Logs
   - Deployments → Function Logs

3. **Teste localmente primeiro:**
   ```bash
   npm run build && npm run preview
   ```
   Se funcionar aqui, o problema é nas variáveis da Vercel

4. **Verifique as variáveis:**
   - Settings → Environment Variables
   - Todas devem começar com `VITE_`
   - Devem estar em Production, Preview, Development

## 🎉 Sucesso!

Se você vê:
- ✅ App carrega sem tela branca
- ✅ Banner amarelo aparece (se não configurado)
- ✅ ErrorBoundary não aparece
- ✅ Console sem erros críticos

**Tudo está funcionando!** Configure as variáveis de ambiente para habilitar todas as funcionalidades.

---

**Links úteis:**
- [SETUP.md](SETUP.md) - Configuração local
- [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md) - Deploy passo a passo
- [FIXES_VERCEL.md](FIXES_VERCEL.md) - O que foi corrigido
