
import React, { useState } from 'react';
import { Mail, Lock, User, Heart, ArrowRight, ChevronLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface AuthScreenProps {
  onLogin: (email: string, name?: string) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
    if (isLogin) {
    // LOGIN
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Erro ao entrar: ' + error.message);
    } else {
      onLogin(email); // você pode buscar mais dados depois
    }
  } else {
    // SIGN UP
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
      alert('Erro ao criar conta: ' + error.message);
    } else {
      alert('Conta criada! Verifique seu e-mail para confirmar.');
      setIsLogin(true);
    }
  }
};
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-80 bg-purple-600 rounded-b-[4rem] shadow-2xl">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute top-10 right-5 w-20 h-20 bg-green-400/20 rounded-full blur-xl"></div>
      </div>

      <div className="relative flex-1 px-8 pt-24 pb-12 flex flex-col justify-center">
        {/* Logo/Branding */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-[2.5rem] shadow-xl shadow-purple-900/10 mb-6">
            <Heart size={48} className="text-purple-600" fill="#7C3AED" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Fincompar</h1>
          <p className="text-purple-100 font-medium opacity-80 mt-2">
            {isLogin ? 'Bem-vindo de volta, casal!' : 'Comecem sua jornada financeira hoje'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-[3rem] p-8 shadow-2xl shadow-gray-200">
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-black uppercase tracking-widest border-b-4 transition-all ${
                isLogin ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-300'
              }`}
            >
              Entrar
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-black uppercase tracking-widest border-b-4 transition-all ${
                !isLogin ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-300'
              }`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={18} />
                </span>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                  placeholder="Seu Nome Completo"
                  className="w-full bg-gray-50 border-0 rounded-2xl py-4 pl-14 pr-5 font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
              </div>
            )}

            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={18} />
              </span>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                placeholder="E-mail do Casal ou Individual"
                className="w-full bg-gray-50 border-0 rounded-2xl py-4 pl-14 pr-5 font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>

            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </span>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                placeholder="Senha de Acesso"
                className="w-full bg-gray-50 border-0 rounded-2xl py-4 pl-14 pr-5 font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>

            {!isLogin && (
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Heart size={18} />
                </span>
                <input 
                  type="email" 
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="E-mail do Parceiro(a) (opcional)"
                  className="w-full bg-gray-100 border-0 rounded-2xl py-4 pl-14 pr-5 font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all italic text-sm"
                />
              </div>
            )}

            {isLogin && (
              <div className="text-right">
                <button type="button" className="text-xs font-black text-purple-600 uppercase tracking-widest">Esqueci a senha</button>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-purple-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-purple-200 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
            >
              {isLogin ? 'Acessar Painel' : 'Começar Agora'} <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-xs text-gray-400 font-medium">Ou conecte com</p>
            <div className="flex justify-center gap-4">
               <button className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 active:bg-gray-100">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
               </button>
               <button className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 active:bg-gray-100">
                  <img src="https://www.svgrepo.com/show/303114/facebook-3-logo.svg" className="w-6 h-6" alt="Facebook" />
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* App Version Info */}
      <div className="p-8 text-center">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Fincompar MVP v1.0.4</p>
      </div>
    </div>
  );
};

export default AuthScreen;
