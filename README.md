# 💰 Fincompar - Finanças em Casal

<div align="center">

![Fincompar](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)
![Version](https://img.shields.io/badge/Version-1.0.4-blue)
![License](https://img.shields.io/badge/License-MIT-green)

**Aplicativo de gestão financeira para casais, com IA e sincronização em tempo real.**

[🚀 Ver Demo](https://seu-projeto.vercel.app) · [📖 Documentação](SETUP.md) · [🐛 Reportar Bug](https://github.com/seu-usuario/fincompar/issues)

</div>

---

## 📱 Sobre o Projeto

O **Fincompar** é uma aplicação web moderna para casais gerenciarem suas finanças juntos. Com inteligência artificial do Google Gemini e backend no Supabase, oferece uma experiência completa de controle financeiro.

### ✨ Funcionalidades

- ✅ **Autenticação segura** com Supabase
- ✅ **Gestão de transações** (entradas e saídas)
- ✅ **Metas compartilhadas** com contribuições individuais
- ✅ **Análise por IA** usando Google Gemini
- ✅ **Dashboard intuitivo** com gráficos
- ✅ **Notificações toast** modernas
- ✅ **Sistema de categorias** para organização
- ✅ **Dicas em áudio** com IA (TTS)
- ✅ **Acessibilidade completa** (ARIA labels)
- ✅ **Validações robustas** em todos os formulários

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)
- Chave de API do [Google AI Studio](https://makersuite.google.com/app/apikey)

### Instalação Local

1. **Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/fincompar.git
cd fincompar
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env.local
```

Edite o `.env.local` com suas chaves:
```env
VITE_GEMINI_API_KEY=sua_chave_gemini
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_supabase
```

4. **Execute o projeto:**
```bash
npm run dev
```

Acesse: `http://localhost:3000`

## 📦 Deploy na Vercel

### Guia Rápido

1. **Faça push para o GitHub**
2. **Importe no Vercel** ([vercel.com](https://vercel.com))
3. **Configure as variáveis de ambiente** (Settings → Environment Variables):
   - `VITE_GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploy!**

📖 **Guia completo:** [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md)

## 🛠️ Tecnologias

- **Frontend:** React 19, TypeScript, Vite
- **Estilização:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth)
- **IA:** Google Gemini (Gemini 3 Flash)
- **Ícones:** Lucide React
- **Deploy:** Vercel

## 📁 Estrutura do Projeto

```
fincompar/
├── components/          # Componentes React
│   ├── Layout.tsx
│   └── Notification.tsx
├── screens/             # Telas da aplicação
│   └── AuthScreen.tsx
├── services/            # Serviços (API)
│   ├── geminiService.ts
│   └── supabaseService.ts
├── hooks/               # Custom hooks
│   └── useDebounce.ts
├── types.ts             # Tipos TypeScript
├── constants.tsx        # Constantes
├── App.tsx              # Componente principal
└── index.tsx            # Entry point
```

## 🗄️ Banco de Dados

Veja o esquema completo e instruções SQL em: [SETUP.md](SETUP.md#estrutura-do-banco-de-dados-supabase)

Tabelas principais:
- `users` - Usuários e parceiros
- `transactions` - Transações financeiras
- `goals` - Metas compartilhadas

## 🔒 Segurança

- ✅ Variáveis de ambiente protegidas
- ✅ Row Level Security (RLS) no Supabase
- ✅ Validações client e server-side
- ✅ Autenticação JWT
- ✅ Sanitização de inputs

## 🎨 Design

Design mobile-first com:
- Paleta roxa/verde moderna
- Animações suaves
- UI inspirada em apps nativos
- Dark mode ready

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Contribuindo

Contribuições são bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 🐛 Problemas Conhecidos

- Bundle size pode ser otimizado com code-splitting
- Login social (Google/Facebook) ainda não implementado
- PWA offline ainda não disponível

## 📞 Suporte

- 📖 [Documentação Completa](SETUP.md)
- 🚀 [Guia de Deploy](DEPLOY_VERCEL.md)
- 🐛 [Issues](https://github.com/seu-usuario/fincompar/issues)

---

<div align="center">

Feito com ❤️ e ☕ para casais que querem organizar suas finanças juntos

[⭐ Dê uma estrela se este projeto foi útil!](https://github.com/seu-usuario/fincompar)

</div>
