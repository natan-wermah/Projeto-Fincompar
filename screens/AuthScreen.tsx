
import React, { useState } from 'react';
import { Mail, Lock, User, Heart, ArrowRight, ChevronLeft, Sparkles } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Notification as NotificationType } from '../types';
import { NotificationContainer } from '../components/Notification';
import { generateId } from '../types';

interface AuthScreenProps {
  onLogin: (email: string, name?: string) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addNotification = (message: string, type: NotificationType['type']) => {
    const newNotification: NotificationType = {
      id: generateId(),
      message,
      type,
      duration: 5000,
    };
    setNotifications((prev) => [...prev, newNotification]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    if (isLogin) {
      // LOGIN
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Tratamento especial para rate limit
        if (error.message.includes('rate limit') || error.message.includes('429') || error.message.includes('Too Many')) {
          addNotification('⏱️ Muitas tentativas de login. Use o Modo Demo para testar o app!', 'warning');
        } else {
          addNotification('Erro ao entrar: ' + error.message, 'error');
        }
      } else {
        addNotification('Login realizado com sucesso!', 'success');
        onLogin(email, name);
      }
    } else {
      // SIGN UP
      if (password.length < 6) {
        addNotification('A senha deve ter no mínimo 6 caracteres', 'warning');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            partner_email: partnerEmail || null,
          },
        },
      });

      if (error) {
        // Tratamento especial para rate limit
        if (error.message.includes('rate limit') || error.message.includes('429') || error.message.includes('Too Many')) {
          addNotification('⏱️ Limite de cadastros atingido (máx. 3-4 por hora). Use o Modo Demo para testar!', 'warning');
        } else {
          addNotification('Erro ao criar conta: ' + error.message, 'error');
        }
      } else {
        addNotification('Conta criada! Verifique seu e-mail para confirmar.', 'success');
        setIsLogin(true);
      }
    }
  } catch (error: any) {
    // Check if it's a network error or 429
    if (error?.message?.includes('429') || error?.message?.includes('Too Many') || error?.message?.includes('rate limit')) {
      addNotification('⏱️ Muitas tentativas. Use o Modo Demo para testar o app!', 'warning');
    } else if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
      addNotification('❌ Erro de conexão. Verifique sua internet ou use o Modo Demo.', 'error');
    } else {
      addNotification('Erro inesperado. Tente novamente ou use o Modo Demo.', 'error');
    }
  } finally {
    setIsLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col max-w-md mx-auto relative overflow-hidden">
      <NotificationContainer notifications={notifications} onClose={removeNotification} />
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-80 bg-purple-600 dark:bg-purple-700 rounded-b-[4rem] shadow-2xl">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute top-10 right-5 w-20 h-20 bg-green-400/20 rounded-full blur-xl"></div>
      </div>

      <div className="relative flex-1 px-8 pt-24 pb-12 flex flex-col justify-center">
        {/* Logo/Branding */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl shadow-purple-900/10 mb-6">
            <Heart size={48} className="text-purple-600 dark:text-purple-400" fill="#7C3AED" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Fincompar</h1>
          <p className="text-purple-100 dark:text-purple-200 font-medium opacity-80 mt-2">
            {isLogin ? 'Bem-vindo de volta, casal!' : 'Comecem sua jornada financeira hoje'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-8 shadow-2xl shadow-gray-200 dark:shadow-gray-900/50">
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-black uppercase tracking-widest border-b-4 transition-all ${
                isLogin ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-300 dark:text-gray-600'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-black uppercase tracking-widest border-b-4 transition-all ${
                !isLogin ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-300 dark:text-gray-600'
              }`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" aria-hidden="true">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Seu Nome Completo"
                  aria-label="Nome completo"
                  disabled={isLoading}
                  className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl py-4 pl-14 pr-5 font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white"
                />
              </div>
            )}

            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" aria-hidden="true">
                <Mail size={18} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="E-mail do Casal ou Individual"
                aria-label="E-mail"
                disabled={isLoading}
                className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl py-4 pl-14 pr-5 font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white"
              />
            </div>

            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" aria-hidden="true">
                <Lock size={18} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Senha de Acesso"
                aria-label="Senha (mínimo 6 caracteres)"
                disabled={isLoading}
                className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl py-4 pl-14 pr-5 font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white"
              />
            </div>

            {!isLogin && (
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" aria-hidden="true">
                  <Heart size={18} />
                </span>
                <input
                  type="email"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="E-mail do Parceiro(a) (opcional)"
                  aria-label="E-mail do parceiro (opcional)"
                  disabled={isLoading}
                  className="w-full bg-gray-100 dark:bg-gray-700/50 border-0 rounded-2xl py-4 pl-14 pr-5 font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all italic text-sm disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white"
                />
              </div>
            )}

            {isLogin && (
              <div className="text-right">
                <button type="button" className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">Esqueci a senha</button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              aria-label={isLogin ? 'Fazer login' : 'Criar conta'}
              className="w-full bg-purple-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-purple-200 dark:shadow-purple-900/30 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isLoading ? 'Aguarde...' : isLogin ? 'Acessar Painel' : 'Começar Agora'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                addNotification('Entrando em Modo Demo...', 'info');
                onLogin('demo@fincompar.com', 'Usuário Demo');
              }}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg dark:shadow-green-900/30 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              Entrar em Modo Demo
            </button>
            <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">
              Teste o app sem criar conta (dados não salvos)
            </p>
          </div>

          <div className="mt-8 text-center space-y-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Ou conecte com</p>
            <div className="flex justify-center gap-4">
               <button className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-600 active:bg-gray-100 dark:active:bg-gray-600">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
               </button>
               <button className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-600 active:bg-gray-100 dark:active:bg-gray-600">
                  <img src="https://www.svgrepo.com/show/303114/facebook-3-logo.svg" className="w-6 h-6" alt="Facebook" />
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* App Version Info */}
      <div className="p-8 text-center">
        <p className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-[0.2em]">Fincompar MVP v1.0.4</p>
      </div>
    </div>
  );
};

export default AuthScreen;
