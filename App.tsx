
import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, Goal, User, EducationalContent, Category, generateId, Notification as NotificationType } from './types';
import Layout from './components/Layout';
import AuthScreen from './screens/AuthScreen';
import { NotificationContainer } from './components/Notification';
import ConfigWarning from './components/ConfigWarning';
import {
  TrendingUp, TrendingDown, Wallet, ArrowRight, Play, FileText,
  ChevronRight, X, UserPlus, Heart, Plus, Target,
  BookOpen, Coins, Edit2, Mail, User as UserIcon, LogOut,
  Settings, Bell, CreditCard, Sparkles, Trash2
} from 'lucide-react';
import { getFinancialSummary, generateAudioTip } from './services/geminiService';
import { CATEGORIES } from './constants';
import { useDebounce } from './hooks/useDebounce';
import { supabase } from './supabaseClient';
import {
  getTransactions,
  addTransaction as addTransactionDB,
  getGoals,
  addGoal as addGoalDB,
  updateGoal as updateGoalDB,
} from './services/supabaseService';

const INITIAL_USER: User = {
  id: 'user_1',
  name: 'Alex Silva',
  email: 'alex@fincompar.com',
  partnerId: 'user_2',
  avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100'
};

const INITIAL_PARTNER: User = {
  id: 'user_2',
  name: 'Sam Costa',
  email: 'sam@fincompar.com',
  partnerId: 'user_1',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100'
};

const EDUCATIONAL_CONTENT: EducationalContent[] = [
  {
    id: '1',
    title: 'Papo de Grana',
    description: 'Como falar de dinheiro sem brigar.',
    type: 'audio',
    content: 'Falar sobre dinheiro é falar sobre sonhos. Comece planejando algo pequeno para o próximo fim de semana.'
  },
  {
    id: '2',
    title: 'A Regra 50-30-20',
    description: 'A divisão ideal para casais.',
    type: 'text',
    content: 'Divida a renda conjunta: 50% para o que é essencial, 30% para o que vocês gostam e 20% para o futuro.'
  }
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [partner, setPartner] = useState<User>(INITIAL_PARTNER);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('Analisando seus hábitos do mês...');
  const [showSummary, setShowSummary] = useState(false);
  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null);
  const [isEditingPartner, setIsEditingPartner] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Debounce transactions and goals for AI summary
  const debouncedTransactions = useDebounce(transactions, 2000);
  const debouncedGoals = useDebounce(goals, 2000);

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

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const loadUserData = useCallback(async () => {
    if (!user.id || !isAuthenticated) return;
    setIsLoadingData(true);
    try {
      const [transactionsData, goalsData] = await Promise.all([
        getTransactions(user.id),
        getGoals(user.id),
      ]);
      setTransactions(transactionsData);
      setGoals(goalsData);
    } catch (error) {
      addNotification('Erro ao carregar dados', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, [user.id, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
    }
  }, [isAuthenticated, loadUserData]);

  const fetchSummary = useCallback(async () => {
    if (!isAuthenticated || debouncedTransactions.length === 0) return;
    try {
      const summary = await getFinancialSummary(debouncedTransactions, debouncedGoals);
      setAiSummary(summary || 'Você está no caminho certo! Continue assim.');
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  }, [debouncedTransactions, debouncedGoals, isAuthenticated]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleLogin = async (email: string, name?: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser({
          id: authUser.id,
          name: name || authUser.user_metadata?.name || 'Usuário',
          email: authUser.email || email,
          partnerId: authUser.user_metadata?.partner_id || null,
          avatar: authUser.user_metadata?.avatar || INITIAL_USER.avatar,
        });
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error in handleLogin:', error);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setActiveTab('dashboard');
      setTransactions([]);
      setGoals([]);
      addNotification('Logout realizado com sucesso', 'success');
    } catch (error) {
      addNotification('Erro ao fazer logout', 'error');
    }
  };

  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;

    // Validações
    if (!description || description.trim().length === 0) {
      addNotification('Por favor, adicione uma descrição', 'warning');
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      addNotification('Por favor, insira um valor válido', 'warning');
      return;
    }

    const newTransaction: Omit<Transaction, 'id' | 'createdAt'> = {
      amount,
      description: description.trim(),
      category: formData.get('category') as Category,
      date: new Date().toISOString().split('T')[0],
      payerId: user.id,
      type: formData.get('type') as 'income' | 'expense'
    };

    try {
      const savedTransaction = await addTransactionDB(newTransaction);
      if (savedTransaction) {
        setTransactions([savedTransaction, ...transactions]);
        setActiveTab('dashboard');
        addNotification(
          `${newTransaction.type === 'income' ? 'Entrada' : 'Saída'} adicionada com sucesso!`,
          'success'
        );
      } else {
        addNotification('Erro ao salvar transação', 'error');
      }
    } catch (error) {
      addNotification('Erro ao adicionar transação', 'error');
    }
  };

  const handleContribution = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!contributionGoal) return;

    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const contributorId = formData.get('contributor') as string;

    // Validações
    if (isNaN(amount) || amount <= 0) {
      addNotification('Por favor, insira um valor válido', 'warning');
      return;
    }

    if (amount > 1000000) {
      addNotification('Valor muito alto. Máximo: R$ 1.000.000', 'warning');
      return;
    }

    try {
      const updatedGoal = { ...contributionGoal };
      updatedGoal.contributions[contributorId] = (updatedGoal.contributions[contributorId] || 0) + amount;
      updatedGoal.currentAmount += amount;

      const savedGoal = await updateGoalDB(contributionGoal.id, {
        currentAmount: updatedGoal.currentAmount,
        contributions: updatedGoal.contributions,
      });

      if (savedGoal) {
        setGoals((prev) =>
          prev.map((g) => (g.id === contributionGoal.id ? savedGoal : g))
        );
        setContributionGoal(null);
        addNotification(`Contribuição de R$ ${amount.toFixed(2)} adicionada!`, 'success');
      } else {
        addNotification('Erro ao salvar contribuição', 'error');
      }
    } catch (error) {
      addNotification('Erro ao adicionar contribuição', 'error');
    }
  };

  const handleAddGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const name = formData.get('goalName') as string;
    const targetAmount = parseFloat(formData.get('targetAmount') as string);

    // Validações
    if (!name || name.trim().length === 0) {
      addNotification('Por favor, dê um nome para a meta', 'warning');
      return;
    }

    if (isNaN(targetAmount) || targetAmount <= 0) {
      addNotification('Por favor, insira um valor válido', 'warning');
      return;
    }

    if (targetAmount > 10000000) {
      addNotification('Valor muito alto. Máximo: R$ 10.000.000', 'warning');
      return;
    }

    const newGoal: Omit<Goal, 'id' | 'createdAt'> = {
      name: name.trim(),
      targetAmount,
      currentAmount: 0,
      contributions: { [user.id]: 0 },
    };

    try {
      const savedGoal = await addGoalDB(newGoal);
      if (savedGoal) {
        setGoals([savedGoal, ...goals]);
        setIsAddingGoal(false);
        addNotification('Meta criada com sucesso!', 'success');
      } else {
        addNotification('Erro ao criar meta', 'error');
      }
    } catch (error) {
      addNotification('Erro ao adicionar meta', 'error');
    }
  };

  const handleUpdateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userName = formData.get('userName') as string;
    const userEmail = formData.get('userEmail') as string;

    // Validações
    if (!userName || userName.trim().length === 0) {
      addNotification('Por favor, insira um nome válido', 'warning');
      return;
    }

    if (!userEmail || !userEmail.includes('@')) {
      addNotification('Por favor, insira um e-mail válido', 'warning');
      return;
    }

    setUser((prev) => ({ ...prev, name: userName.trim(), email: userEmail.trim() }));
    setIsEditingUser(false);
    addNotification('Perfil atualizado com sucesso!', 'success');
  };

  const handleUpdatePartner = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const partnerName = formData.get('partnerName') as string;
    const partnerEmail = formData.get('partnerEmail') as string;

    // Validações
    if (!partnerName || partnerName.trim().length === 0) {
      addNotification('Por favor, insira um nome válido', 'warning');
      return;
    }

    if (!partnerEmail || !partnerEmail.includes('@')) {
      addNotification('Por favor, insira um e-mail válido', 'warning');
      return;
    }

    setPartner((prev) => ({ ...prev, name: partnerName.trim(), email: partnerEmail.trim() }));
    setIsEditingPartner(false);
    addNotification('Parceiro atualizado com sucesso!', 'success');
  };

  const playAudioTip = async (text: string) => {
    const base64 = await generateAudioTip(text);
    if (!base64) return;
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
    const chanData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) chanData[i] = dataInt16[i] / 32768.0;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start();
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="bg-purple-600 rounded-[2rem] p-7 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <p className="text-purple-100 text-sm font-semibold mb-1 opacity-80">Saldo total do casal</p>
        <div className="flex items-end gap-2">
          <h2 className="text-4xl font-black">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          <div className="mb-2 bg-green-400 w-2 h-2 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] uppercase font-black text-purple-100 mb-1 tracking-widest">Entradas</p>
            <p className="font-bold text-lg text-green-300">R$ {totalIncome.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] uppercase font-black text-purple-100 mb-1 tracking-widest">Saídas</p>
            <p className="font-bold text-lg text-red-300">R$ {totalExpense.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setShowSummary(true)}
        className="w-full bg-white border border-purple-100 rounded-3xl p-5 flex items-center justify-between shadow-sm active:scale-95 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-purple-500 to-indigo-500 p-3 rounded-2xl text-white shadow-md shadow-purple-200">
            <Sparkles size={22} />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-purple-600 uppercase tracking-tighter">Fincompar AI</p>
            <p className="text-sm text-gray-700 font-semibold line-clamp-1">Você economizou 12% a mais que o mês passado!</p>
          </div>
        </div>
        <ChevronRight size={20} className="text-gray-300" />
      </button>

      <div>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-black text-gray-800 tracking-tight text-lg">Suas Metas</h3>
          <ArrowRight size={20} className="text-purple-600" onClick={() => setActiveTab('goals')} />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
          {goals.map(goal => (
            <div key={goal.id} className="min-w-[260px] bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Target size={20} />
                </div>
                <p className="font-bold text-gray-700 truncate">{goal.name}</p>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-purple-600 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">
                  {((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}% completos
                </p>
                <p className="text-[10px] font-bold text-gray-400">R$ {goal.targetAmount.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-black text-gray-800 tracking-tight text-lg mb-4 px-1">Gastos Recentes</h3>
        <div className="space-y-3">
          {transactions.slice(0, 4).map(t => (
            <div key={t.id} className="bg-white p-4 rounded-3xl flex items-center justify-between shadow-sm active:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
                  t.type === 'income' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  {CATEGORIES.find(c => c.name === t.category)?.icon || '💰'}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{t.description}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {t.category} • {t.payerId === 'user_1' ? user.name.split(' ')[0] : partner.name.split(' ')[0]}
                  </p>
                </div>
              </div>
              <p className={`font-black text-base ${t.type === 'income' ? 'text-green-600' : 'text-gray-800'}`}>
                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAdd = () => (
    <div className="animate-slideUp pb-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black text-gray-800">Novo Registro</h2>
        <button
          onClick={() => setActiveTab('dashboard')}
          aria-label="Fechar formulário"
          className="p-2 bg-gray-100 rounded-full active:scale-95 transition-all"
        >
          <X size={24} />
        </button>
      </div>
      <form onSubmit={handleAddTransaction} className="space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
          <div>
            <label htmlFor="transactionAmount" className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-4">
              Valor da transação
            </label>
            <div className="flex items-center gap-3 border-b-2 border-purple-100 pb-2 focus-within:border-purple-600 transition-all">
              <span className="text-2xl font-black text-gray-300" aria-hidden="true">R$</span>
              <input
                id="transactionAmount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                max="1000000"
                required
                autoFocus
                aria-label="Valor da transação em reais"
                className="w-full bg-transparent border-0 outline-none text-4xl font-black text-purple-600 placeholder:text-gray-100"
                placeholder="0,00"
              />
            </div>
          </div>
          <div>
            <label htmlFor="transactionDesc" className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">
              O que foi?
            </label>
            <input
              id="transactionDesc"
              name="description"
              type="text"
              required
              maxLength={100}
              aria-label="Descrição da transação"
              className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-5 font-bold focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Ex: Jantar de sexta"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="transactionType" className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">
                Tipo
              </label>
              <select
                id="transactionType"
                name="type"
                aria-label="Tipo de transação"
                className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-5 font-bold focus:ring-2 focus:ring-purple-500 outline-none appearance-none"
              >
                <option value="expense">Saída 💸</option>
                <option value="income">Entrada 💰</option>
              </select>
            </div>
            <div>
              <label htmlFor="transactionCategory" className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">
                Categoria
              </label>
              <select
                id="transactionCategory"
                name="category"
                aria-label="Categoria da transação"
                className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-5 font-bold focus:ring-2 focus:ring-purple-500 outline-none appearance-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <button
          type="submit"
          aria-label="Salvar transação"
          className="w-full bg-purple-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-purple-200 active:scale-95 transition-all text-lg tracking-tight"
        >
          Salvar no App
        </button>
      </form>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-black text-gray-800">Nossas Metas</h2>
        <button
          onClick={() => setIsAddingGoal(true)}
          aria-label="Adicionar nova meta"
          className="bg-purple-600 text-white p-3 rounded-2xl shadow-lg shadow-purple-200 active:scale-95 transition-all"
        >
          <Plus size={22} />
        </button>
      </div>
      <div className="space-y-5">
        {goals.map(goal => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          return (
            <div key={goal.id} className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-gray-100 space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-50 p-4 rounded-3xl text-purple-600">
                    <Target size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-xl">{goal.name}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Alvo: R$ {goal.targetAmount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-purple-100 px-3 py-1 rounded-full">
                   <p className="text-purple-600 font-black text-xs">{progress.toFixed(0)}%</p>
                </div>
              </div>
              
              <div className="w-full h-4 bg-gray-50 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-1000" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <img src={user.avatar} className="w-4 h-4 rounded-full" />
                    <p className="text-[10px] text-gray-400 font-black uppercase">{user.name.split(' ')[0]}</p>
                  </div>
                  <p className="text-base font-black text-gray-700">R$ {(goal.contributions['user_1'] || 0).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <img src={partner.avatar} className="w-4 h-4 rounded-full" />
                    <p className="text-[10px] text-gray-400 font-black uppercase">{partner.name.split(' ')[0]}</p>
                  </div>
                  <p className="text-base font-black text-gray-700">R$ {(goal.contributions['user_2'] || 0).toLocaleString()}</p>
                </div>
              </div>

              <button 
                onClick={() => setContributionGoal(goal)}
                className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
              >
                <Coins size={18} /> Contribuir Agora
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="px-1">
        <h2 className="text-2xl font-black text-gray-800">Ajustes & Parceria</h2>
        <p className="text-sm text-gray-400 font-semibold italic">Seu ecossistema Fincompar</p>
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
         <div className="flex items-center gap-5 mb-6">
            <img src={user.avatar} className="w-20 h-20 rounded-[2rem] border-4 border-purple-50 shadow-lg object-cover" />
            <div className="flex-1">
               <h3 className="font-black text-gray-800 text-xl leading-tight">{user.name}</h3>
               <p className="text-xs text-purple-500 font-bold mb-3">{user.email}</p>
               <button 
                  onClick={() => setIsEditingUser(true)}
                  className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-black uppercase tracking-wider active:bg-purple-100 transition-colors"
               >
                  Editar Perfil
               </button>
            </div>
         </div>
         <div className="space-y-1">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl active:bg-gray-100 transition-colors">
               <div className="flex items-center gap-3">
                  <Bell size={18} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-700">Notificações</span>
               </div>
               <div className="w-10 h-6 bg-purple-600 rounded-full p-1 flex justify-end">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
               </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl active:bg-gray-100 transition-colors">
               <div className="flex items-center gap-3">
                  <CreditCard size={18} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-700">Meus Cartões</span>
               </div>
               <ChevronRight size={18} className="text-gray-300" />
            </div>
         </div>
      </div>

      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-[2.5rem] p-7 text-white shadow-xl shadow-green-100">
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-xl flex items-center gap-2"><Heart size={22} fill="white" /> Parceria Ativa</h3>
            <Settings size={20} className="opacity-60" onClick={() => setIsEditingPartner(true)} />
         </div>
         <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20">
            <img src={partner.avatar} className="w-14 h-14 rounded-2xl border-2 border-white/30 object-cover shadow-inner" />
            <div className="flex-1">
               <p className="font-black text-lg">{partner.name}</p>
               <p className="text-xs text-green-100 font-semibold opacity-80 italic">{partner.email}</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-tighter shadow-sm border border-white/10">Sincronizado</div>
         </div>
      </div>

      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Dicas Fincompar</h4>
        {EDUCATIONAL_CONTENT.map(content => (
          <div key={content.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group active:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${content.type === 'audio' ? 'bg-indigo-50 text-indigo-500' : 'bg-green-50 text-green-500'}`}>
                {content.type === 'audio' ? <Play size={20} /> : <FileText size={20} />}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{content.title}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{content.type === 'audio' ? 'Dica em áudio • 1min' : 'Texto curto • 2min'}</p>
              </div>
            </div>
            <button 
              onClick={() => content.type === 'audio' && playAudioTip(content.content)}
              className="w-10 h-10 flex items-center justify-center text-gray-300 group-active:text-purple-600 transition-colors"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleLogout}
        aria-label="Encerrar sessão"
        className="w-full py-5 rounded-3xl border-2 border-red-50 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-3"
      >
        <LogOut size={16} /> Encerrar Sessão
      </button>
    </div>
  );

  const getActiveTabContent = () => {
    switch(activeTab) {
      case 'dashboard': return renderDashboard();
      case 'transactions': return <div className="animate-fadeIn p-6 text-center font-bold text-gray-400">Em breve: Histórico completo</div>;
      case 'add': return renderAdd();
      case 'goals': return renderGoals();
      case 'profile': return renderProfile();
      default: return renderDashboard();
    }
  };

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} title="Fincompar">
      <NotificationContainer notifications={notifications} onClose={removeNotification} />
      <ConfigWarning />
      {getActiveTabContent()}

      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px] p-4 transition-all duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-slideUp">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-purple-100 p-4 rounded-3xl text-purple-600 shadow-sm">
                <Sparkles size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Análise IA</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Resumo do Mês</p>
              </div>
            </div>
            <div className="bg-purple-50/50 p-6 rounded-[2rem] border border-purple-100 mb-8">
               <p className="text-gray-700 font-medium leading-relaxed italic text-lg">"{aiSummary}"</p>
            </div>
            <button
              onClick={() => setShowSummary(false)}
              aria-label="Fechar análise da IA"
              className="w-full bg-gray-900 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-gray-200 active:scale-95 transition-all"
            >
              Entendido!
            </button>
          </div>
        </div>
      )}

      {contributionGoal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-slideUp">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-green-100 p-4 rounded-3xl text-green-600">
                <Coins size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Contribuir</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{contributionGoal.name}</p>
              </div>
            </div>
            
            <form onSubmit={handleContribution} className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <label className="cursor-pointer group">
                  <input type="radio" name="contributor" value="user_1" defaultChecked className="hidden peer" />
                  <div className="flex flex-col items-center p-5 rounded-[2rem] border-2 border-gray-50 peer-checked:border-purple-600 peer-checked:bg-purple-50 transition-all shadow-sm">
                    <img src={user.avatar} className="w-14 h-14 rounded-2xl mb-3 object-cover shadow-md" />
                    <span className="font-black text-xs text-gray-700 uppercase">{user.name.split(' ')[0]}</span>
                  </div>
                </label>
                <label className="cursor-pointer group">
                  <input type="radio" name="contributor" value="user_2" className="hidden peer" />
                  <div className="flex flex-col items-center p-5 rounded-[2rem] border-2 border-gray-50 peer-checked:border-purple-600 peer-checked:bg-purple-50 transition-all shadow-sm">
                    <img src={partner.avatar} className="w-14 h-14 rounded-2xl mb-3 object-cover shadow-md" />
                    <span className="font-black text-xs text-gray-700 uppercase">{partner.name.split(' ')[0]}</span>
                  </div>
                </label>
              </div>

              <div>
                <label htmlFor="contributionAmount" className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Quanto vai guardar?
                </label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-black text-xl" aria-hidden="true">
                    R$
                  </span>
                  <input
                    id="contributionAmount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="1000000"
                    required
                    autoFocus
                    aria-label="Valor da contribuição em reais"
                    className="w-full bg-gray-50 border-0 rounded-[2rem] py-6 pl-16 pr-6 focus:ring-4 focus:ring-purple-100 font-black text-3xl text-purple-600 outline-none"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                 <button
                   type="button"
                   onClick={() => setContributionGoal(null)}
                   aria-label="Cancelar contribuição"
                   className="flex-1 py-5 bg-gray-100 rounded-[2rem] font-black text-gray-500 uppercase text-xs active:bg-gray-200"
                 >
                   Cancelar
                 </button>
                 <button
                   type="submit"
                   aria-label="Confirmar contribuição"
                   className="flex-[2] bg-purple-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-purple-100 active:scale-95 transition-all text-sm uppercase tracking-widest"
                 >
                   Confirmar
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditingUser && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-slideUp">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-purple-100 p-4 rounded-3xl text-purple-600">
                <Edit2 size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Editar Perfil</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Sincronização em Tempo Real</p>
              </div>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-6">
              <input
                name="userName"
                type="text"
                defaultValue={user.name}
                required
                maxLength={100}
                aria-label="Seu nome"
                className="w-full bg-gray-50 border-0 rounded-2xl py-5 px-6 font-bold outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Seu nome"
              />
              <input
                name="userEmail"
                type="email"
                defaultValue={user.email}
                required
                aria-label="Seu e-mail"
                className="w-full bg-gray-50 border-0 rounded-2xl py-5 px-6 font-bold outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Seu e-mail"
              />
              <button
                type="submit"
                aria-label="Atualizar perfil"
                className="w-full bg-purple-600 text-white font-black py-5 rounded-[2rem] active:scale-95 transition-all text-sm tracking-widest"
              >
                ATUALIZAR MEU PERFIL
              </button>
              <button
                type="button"
                onClick={() => setIsEditingUser(false)}
                aria-label="Voltar"
                className="w-full py-2 text-xs font-black text-gray-400 uppercase tracking-widest"
              >
                Voltar
              </button>
            </form>
          </div>
        </div>
      )}

      {isEditingPartner && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-slideUp">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-green-100 p-4 rounded-3xl text-green-600">
                <Settings size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Editar Parceiro</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Sincronização em Tempo Real</p>
              </div>
            </div>
            <form onSubmit={handleUpdatePartner} className="space-y-6">
              <input
                name="partnerName"
                type="text"
                defaultValue={partner.name}
                required
                maxLength={100}
                aria-label="Nome do parceiro"
                className="w-full bg-gray-50 border-0 rounded-2xl py-5 px-6 font-bold outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Nome do parceiro"
              />
              <input
                name="partnerEmail"
                type="email"
                defaultValue={partner.email}
                required
                aria-label="E-mail do parceiro"
                className="w-full bg-gray-50 border-0 rounded-2xl py-5 px-6 font-bold outline-none focus:ring-2 focus:ring-green-500"
                placeholder="E-mail do parceiro"
              />
              <button
                type="submit"
                aria-label="Atualizar parceiro"
                className="w-full bg-green-600 text-white font-black py-5 rounded-[2rem] active:scale-95 transition-all text-sm tracking-widest"
              >
                ATUALIZAR PARCEIRO
              </button>
              <button
                type="button"
                onClick={() => setIsEditingPartner(false)}
                aria-label="Voltar"
                className="w-full py-2 text-xs font-black text-gray-400 uppercase tracking-widest"
              >
                Voltar
              </button>
            </form>
          </div>
        </div>
      )}

      {isAddingGoal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-slideUp">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-purple-100 p-4 rounded-3xl text-purple-600">
                <Target size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Nova Meta</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Objetivos em Casal</p>
              </div>
            </div>
            <form onSubmit={handleAddGoal} className="space-y-6">
              <div>
                <label htmlFor="goalName" className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Nome da meta
                </label>
                <input
                  id="goalName"
                  name="goalName"
                  type="text"
                  required
                  maxLength={50}
                  placeholder="Ex: Lua de mel"
                  aria-label="Nome da meta"
                  className="w-full bg-gray-50 border-0 rounded-2xl py-5 px-6 font-bold outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label htmlFor="targetAmount" className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Valor alvo
                </label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-black text-xl" aria-hidden="true">
                    R$
                  </span>
                  <input
                    id="targetAmount"
                    name="targetAmount"
                    type="number"
                    step="0.01"
                    required
                    min="1"
                    max="10000000"
                    placeholder="0,00"
                    aria-label="Valor alvo da meta"
                    className="w-full bg-gray-50 border-0 rounded-[2rem] py-6 pl-16 pr-6 focus:ring-4 focus:ring-purple-100 font-black text-3xl text-purple-600 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingGoal(false)}
                  aria-label="Cancelar"
                  className="flex-1 py-5 bg-gray-100 rounded-[2rem] font-black text-gray-500 uppercase text-xs active:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  aria-label="Criar meta"
                  className="flex-[2] bg-purple-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-purple-100 active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                  Criar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slideUp { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </Layout>
  );
};

export default App;
