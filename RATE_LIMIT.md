# ⏱️ Resolvendo Problema de Rate Limit do Supabase

## 🔴 O Problema

**Erro:** "email rate limit exceeded"

Isso acontece quando você tenta criar muitas contas em pouco tempo. O Supabase gratuito tem limites de:
- **3-4 cadastros por hora** por IP
- **Emails de confirmação limitados**

## ✅ Soluções Implementadas

### 1. **Modo Demo** (Recomendado) 🎯

Adicionei um botão **"Entrar em Modo Demo"** na tela de login:

- ✅ Entra sem precisar criar conta
- ✅ Testa todas as funcionalidades
- ⚠️ Dados não são salvos (reinicia ao recarregar)

**Como usar:**
1. Abra o app
2. Clique em **"Entrar em Modo Demo"**
3. Pronto! Você está dentro do app

### 2. Tratamento de Erro Melhorado

Agora quando ocorre rate limit, você vê:
- Mensagem amigável: "Aguarde 1 hora ou use o Modo Demo"
- Não mostra erro técnico assustador
- Sugere alternativas

## 🛠️ Outras Soluções

### Para Desenvolvedores:

#### Solução 1: Aguardar 1 hora
O limite reseta após 1 hora. É chato, mas é o mais simples.

#### Solução 2: Usar VPN ou Rede Diferente
O rate limit é por IP. Mudando o IP, você consegue criar mais contas.
- Use celular com dados móveis
- Use VPN
- Use WiFi diferente

#### Solução 3: Desabilitar Confirmação de Email

No Supabase Dashboard:
1. Authentication → Email Templates
2. Settings → Enable email confirmations: **OFF**

⚠️ **Cuidado:** Isso permite que qualquer email seja usado sem verificação.

#### Solução 4: Aumentar Limite (Plano Pago)

Se você precisa de mais cadastros:
1. Supabase Dashboard → Settings → Billing
2. Upgrade para plano Pro ($25/mês)
3. Limites aumentados significativamente

### Para Usuários Finais:

#### Opção 1: Modo Demo
Use o botão verde **"Entrar em Modo Demo"**

#### Opção 2: Login Social (Futuro)
Login com Google/Facebook não conta no rate limit de email
(ainda não implementado no projeto)

## 🔧 Para Deploy na Vercel

### Configurar SMTP Customizado

Use seu próprio servidor de email para evitar limites:

1. **No Supabase Dashboard:**
   - Settings → Auth → SMTP Settings
   - Configure SendGrid, Mailgun, ou AWS SES

2. **Variáveis no Supabase:**
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=sua_chave_api
   SMTP_FROM=noreply@seudominio.com
   ```

3. **Resultado:**
   - Sem limite de emails
   - Mais confiável
   - Custo: ~$0-15/mês dependendo do volume

## 📊 Entendendo os Limites

### Plano Gratuito (Atual):
- 3-4 cadastros/hora por IP
- ~100 emails confirmação/dia
- 50.000 usuários ativos/mês

### Plano Pro ($25/mês):
- 100 cadastros/hora
- Emails ilimitados (com SMTP próprio)
- 100.000 usuários ativos/mês

## 🎯 Recomendação para Desenvolvimento

1. **Use Modo Demo** para testar o app
2. **Crie 1-2 contas reais** apenas para testar autenticação
3. **Use Mock Data** para desenvolvimento (já implementado)
4. **Deploy em produção** com SMTP configurado

## 💡 Dicas

### Para Testes Locais:
```typescript
// Mock user para desenvolvimento
const DEMO_USER = {
  id: 'demo_user',
  email: 'demo@fincompar.com',
  name: 'Usuário Demo'
};
```

### Para Não Atingir Rate Limit:
- ✅ Use o mesmo email para login/teste
- ✅ Use Modo Demo para features
- ✅ Crie conta real só quando necessário
- ❌ Não fique criando várias contas para testar

## 🚀 Implementação no Código

### AuthScreen.tsx - Modo Demo

```typescript
// Botão adicionado
<button
  onClick={() => {
    onLogin('demo@fincompar.com', 'Usuário Demo');
  }}
>
  Entrar em Modo Demo
</button>
```

### Tratamento de Rate Limit

```typescript
if (error.message.includes('rate limit')) {
  addNotification(
    '⏱️ Limite atingido. Aguarde 1 hora ou use Modo Demo.',
    'warning'
  );
}
```

## ❓ FAQ

**P: Quanto tempo demora para resetar?**
R: Exatamente 1 hora a partir da última tentativa.

**P: Posso contornar isso?**
R: Sim, com VPN ou rede diferente, mas use o Modo Demo.

**P: O Modo Demo salva dados?**
R: Não, ao recarregar a página os dados são perdidos.

**P: Preciso pagar para usar?**
R: Não! Use o Modo Demo gratuitamente.

**P: Como saber quantas tentativas faltam?**
R: O Supabase não informa, mas geralmente são 3-4 por hora.

---

**Solução Rápida:**
Clique em **"Entrar em Modo Demo"** e use o app sem limites! ✨
