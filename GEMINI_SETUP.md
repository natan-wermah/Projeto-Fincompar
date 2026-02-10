# 🤖 Como Configurar o Gemini AI (GRÁTIS)

O Fincompar usa o **Google Gemini** para gerar resumos financeiros inteligentes. A boa notícia: **é totalmente gratuito para uso pessoal!**

## 📋 Passo a Passo

### 1️⃣ Obter Chave API Gratuita

1. Acesse: [ai.google.dev/gemini-api/docs/api-key](https://ai.google.dev/gemini-api/docs/api-key)
2. Clique em **"Get API key"** ou **"Get an API key"**
3. Faça login com sua conta Google
4. Clique em **"Create API key"** ou **"Create API key in new project"**
5. Copie a chave (começa com `AIza...`)

### 2️⃣ Adicionar no Vercel

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique no projeto **Fincompar**
3. Vá em **Settings** → **Environment Variables**
4. Procure a variável `VITE_GEMINI_API_KEY` e clique em **Edit**
5. Cole sua chave API
6. Marque ✅ **Production**, ✅ **Preview**, ✅ **Development**
7. Clique em **Save**

### 3️⃣ Redeployar

1. Vá em **Deployments**
2. Clique nos **3 pontinhos (...)** no deployment mais recente
3. Clique em **Redeploy**
4. Aguarde 1-2 minutos

### 4️⃣ Testar

Acesse seu app e clique no botão **"✨ Análise IA"** no dashboard. Você deve ver um resumo personalizado!

---

## 🆓 Plano Gratuito do Gemini

O tier gratuito inclui:
- ✅ **15 requisições por minuto**
- ✅ **1 milhão de tokens por dia**
- ✅ **1.500 requisições por dia**
- ✅ **Uso ilimitado** (dentro dos limites acima)

**Mais que suficiente** para uso pessoal no Fincompar!

---

## 🔒 Segurança

- ✅ A chave API fica **apenas no servidor Vercel**
- ✅ Nunca é exposta no código do navegador
- ✅ Só você tem acesso às suas variáveis de ambiente

---

## ❓ Problemas Comuns

### "API key not valid"
- Certifique-se de copiar a chave **completa** (começa com `AIza`)
- Verifique se não há espaços antes/depois da chave

### "Quota exceeded"
- Você atingiu o limite de 1.500 requisições por dia
- Aguarde 24 horas ou crie um novo projeto no Google AI Studio

### Resumo não aparece
- Verifique se você redeploy após adicionar a variável
- Abra o Console (F12) e procure por erros relacionados ao Gemini

---

## 📚 Recursos

- [Documentação Gemini API](https://ai.google.dev/gemini-api/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [Preços e Limites](https://ai.google.dev/pricing)

---

💡 **Dica**: Se você não configurar o Gemini, o app continua funcionando normalmente! Você só não terá os resumos personalizados com IA.
