
import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, Goal, User, EducationalContent, Category, Investment, InvestmentCategory, PartnerInvitation, generateId, Notification as NotificationType } from './types';
import Layout from './components/Layout';
import AuthScreen from './screens/AuthScreen';
import { NotificationContainer } from './components/Notification';
import ConfigWarning from './components/ConfigWarning';
import PieChart from './components/PieChart';
import {
  TrendingUp, TrendingDown, Wallet, ArrowRight, Play, FileText,
  ChevronRight, ChevronLeft, X, UserPlus, Heart, Plus, Target,
  BookOpen, Coins, Edit2, Mail, User as UserIcon, LogOut,
  Settings, Bell, CreditCard, Sparkles, Trash2, Compass, ArrowLeft,
  Newspaper, Wrench, Headphones, Lock, Send, Check, Clock, Loader2, Camera
} from 'lucide-react';
import { getFinancialSummary, generateAudioTip } from './services/geminiService';
import { CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, INVESTMENT_CATEGORIES } from './constants';
import { useDebounce } from './hooks/useDebounce';
import { supabase } from './supabaseClient';
import {
  getTransactions,
  addTransaction as addTransactionDB,
  getGoals,
  addGoal as addGoalDB,
  updateGoal as updateGoalDB,
  getInvestments,
  addInvestment as addInvestmentDB,
  deleteInvestment as deleteInvestmentDB,
  deleteGoal as deleteGoalDB,
  sendPartnerInvitation,
  getReceivedInvitations,
  getSentInvitations,
  acceptPartnerInvitation,
  rejectPartnerInvitation,
  cancelPartnerInvitation,
  getPartnerProfile,
  getUserProfile,
  uploadAvatar,
  updateUserProfile,
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
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('Analisando seus hábitos do mês...');
  const [showSummary, setShowSummary] = useState(false);
  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [isEditingPartner, setIsEditingPartner] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showRemovePartnerConfirmation, setShowRemovePartnerConfirmation] = useState(false);
  const [showInvitePartner, setShowInvitePartner] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [receivedInvitations, setReceivedInvitations] = useState<PartnerInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<PartnerInvitation[]>([]);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [transactionTypeSelected, setTransactionTypeSelected] = useState<'income' | 'expense' | 'investment' | null>(null);
  const [periodFilter, setPeriodFilter] = useState<'week' | 'month' | 'year' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('fincompar-dark-mode');
    return saved === 'true';
  });
  const [showChartModal, setShowChartModal] = useState<'income' | 'expense' | null>(null);
  const [showInvestmentsModal, setShowInvestmentsModal] = useState(false);

  // Debounce transactions and goals for AI summary
  const debouncedTransactions = useDebounce(transactions, 2000);
  const debouncedGoals = useDebounce(goals, 2000);

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('fincompar-dark-mode', isDarkMode.toString());
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

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
  const totalInvested = investments.reduce((acc, curr) => acc + curr.amount, 0);

  const loadUserData = useCallback(async () => {
    if (!user.id || !isAuthenticated) return;
    setIsLoadingData(true);
    try {
      const [transactionsData, goalsData, investmentsData] = await Promise.all([
        getTransactions(user.id),
        getGoals(user.id),
        getInvestments(user.id),
      ]);
      setTransactions(transactionsData);
      setGoals(goalsData);
      setInvestments(investmentsData);
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

  const loadInvitations = useCallback(async () => {
    if (!user.id || !user.email || !isAuthenticated || user.email === 'demo@fincompar.com') return;
    try {
      const [received, sent] = await Promise.all([
        getReceivedInvitations(user.email),
        getSentInvitations(user.id),
      ]);
      setReceivedInvitations(received);
      setSentInvitations(sent);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  }, [user.id, user.email, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadInvitations();
    }
  }, [isAuthenticated, loadInvitations]);

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      addNotification('Digite o email do parceiro(a)', 'warning');
      return;
    }
    if (inviteEmail.trim() === user.email) {
      addNotification('Você não pode convidar a si mesmo', 'warning');
      return;
    }
    setIsSendingInvite(true);
    try {
      const invitation = await sendPartnerInvitation(user.id, user.name, user.email, inviteEmail.trim());
      if (invitation) {
        setSentInvitations(prev => [invitation, ...prev]);
        setInviteEmail('');
        setShowInvitePartner(false);
        addNotification('Convite enviado com sucesso!', 'success');
      } else {
        addNotification('Erro ao enviar convite. Verifique o email.', 'error');
      }
    } catch {
      addNotification('Erro ao enviar convite', 'error');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleAcceptInvite = async (invitation: PartnerInvitation) => {
    try {
      const success = await acceptPartnerInvitation(invitation.id);
      if (success) {
        // Carregar dados do parceiro
        const partnerData = await getPartnerProfile(invitation.senderId);
        if (partnerData) {
          setPartner(partnerData);
          setUser(prev => ({ ...prev, partnerId: invitation.senderId }));
        }
        setReceivedInvitations(prev => prev.filter(i => i.id !== invitation.id));
        addNotification('Parceiro(a) vinculado(a) com sucesso!', 'success');
      } else {
        addNotification('Erro ao aceitar convite', 'error');
      }
    } catch {
      addNotification('Erro ao aceitar convite', 'error');
    }
  };

  const handleRejectInvite = async (invitationId: string) => {
    try {
      const success = await rejectPartnerInvitation(invitationId);
      if (success) {
        setReceivedInvitations(prev => prev.filter(i => i.id !== invitationId));
        addNotification('Convite recusado', 'info');
      }
    } catch {
      addNotification('Erro ao recusar convite', 'error');
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    try {
      const success = await cancelPartnerInvitation(invitationId);
      if (success) {
        setSentInvitations(prev => prev.filter(i => i.id !== invitationId));
        addNotification('Convite cancelado', 'info');
      }
    } catch {
      addNotification('Erro ao cancelar convite', 'error');
    }
  };

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

  // Reset transaction type selection when leaving 'add' tab
  useEffect(() => {
    if (activeTab !== 'add') {
      setTransactionTypeSelected(null);
    }
  }, [activeTab]);

  const handleLogin = async (email: string, name?: string) => {
    // Demo mode: skip Supabase authentication
    if (email === 'demo@fincompar.com') {
      setUser({
        id: 'demo-user-id',
        name: name || 'Usuário Demo',
        email: email,
        partnerId: null,
        avatar: INITIAL_USER.avatar,
      });
      setIsAuthenticated(true);
      return;
    }

    // Normal authentication with Supabase
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Buscar perfil de public.users (tem partner_id real)
        const profile = await getUserProfile(authUser.id);

        const currentUser: User = {
          id: authUser.id,
          name: profile?.name || name || authUser.user_metadata?.name || 'Usuário',
          email: profile?.email || authUser.email || email,
          partnerId: profile?.partnerId || null,
          avatar: profile?.avatar || INITIAL_USER.avatar,
        };
        setUser(currentUser);

        // Se tem parceiro vinculado, carregar dados do parceiro
        if (currentUser.partnerId) {
          const partnerData = await getPartnerProfile(currentUser.partnerId);
          if (partnerData) {
            setPartner(partnerData);
          }
        }

        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error in handleLogin:', error);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = async () => {
    try {
      // Only call Supabase if not in demo mode
      if (user?.email !== 'demo@fincompar.com') {
        await supabase.auth.signOut();
      }
      setIsAuthenticated(false);
      setActiveTab('dashboard');
      setTransactions([]);
      setGoals([]);
      setInvestments([]);
      setUser(null);
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
      date: formData.get('date') as string,
      payerId: user.id,
      type: formData.get('type') as 'income' | 'expense'
    };

    try {
      let savedTransaction: Transaction | null = null;

      // Demo mode: save locally only
      if (user?.email === 'demo@fincompar.com') {
        savedTransaction = {
          ...newTransaction,
          id: generateId(),
          createdAt: new Date().toISOString()
        };
      } else {
        // Real mode: save to Supabase
        savedTransaction = await addTransactionDB(newTransaction);
      }

      if (savedTransaction) {
        setTransactions([savedTransaction, ...transactions]);
        setActiveTab('dashboard');
        setTransactionTypeSelected(null); // Reset transaction type selection
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

      let savedGoal: Goal | null = null;

      // Demo mode: update locally only
      if (user?.email === 'demo@fincompar.com') {
        savedGoal = updatedGoal;
      } else {
        // Real mode: save to Supabase
        savedGoal = await updateGoalDB(contributionGoal.id, {
          currentAmount: updatedGoal.currentAmount,
          contributions: updatedGoal.contributions,
        });
      }

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

    const contributions: Record<string, number> = { [user.id]: 0 };
    if (partner?.id) {
      contributions[partner.id] = 0;
    }

    const newGoal: Omit<Goal, 'id' | 'createdAt'> = {
      name: name.trim(),
      targetAmount,
      currentAmount: 0,
      contributions,
    };

    try {
      let savedGoal: Goal | null = null;

      // Demo mode: save locally only
      if (user?.email === 'demo@fincompar.com') {
        savedGoal = {
          ...newGoal,
          id: generateId(),
          createdAt: new Date().toISOString()
        };
      } else {
        // Real mode: save to Supabase
        savedGoal = await addGoalDB(newGoal);
      }

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

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    try {
      if (user?.email === 'demo@fincompar.com') {
        setGoals(prev => prev.filter(g => g.id !== goalToDelete.id));
      } else {
        const success = await deleteGoalDB(goalToDelete.id);
        if (!success) {
          addNotification('Erro ao excluir meta', 'error');
          setGoalToDelete(null);
          return;
        }
        setGoals(prev => prev.filter(g => g.id !== goalToDelete.id));
      }
      addNotification('Meta excluída com sucesso', 'success');
    } catch {
      addNotification('Erro ao excluir meta', 'error');
    } finally {
      setGoalToDelete(null);
    }
  };

  const handleAddInvestment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    const platform = formData.get('platform') as string;
    const quantityStr = formData.get('quantity') as string;
    const quantity = quantityStr && quantityStr.trim() !== '' ? parseFloat(quantityStr) : undefined;

    // Validações
    if (!description || description.trim().length === 0) {
      addNotification('Por favor, adicione uma descrição do investimento', 'warning');
      return;
    }

    if (!platform || platform.trim().length === 0) {
      addNotification('Por favor, informe a plataforma usada', 'warning');
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      addNotification('Por favor, insira um valor válido', 'warning');
      return;
    }

    if (amount > 10000000) {
      addNotification('Valor muito alto. Máximo: R$ 10.000.000', 'warning');
      return;
    }

    const newInvestment: Omit<Investment, 'id' | 'createdAt'> = {
      amount,
      description: description.trim(),
      category: formData.get('category') as InvestmentCategory,
      platform: platform.trim(),
      quantity,
      date: formData.get('date') as string,
      userId: user.id,
    };

    try {
      let savedInvestment: Investment | null = null;

      // Demo mode: save locally only
      if (user?.email === 'demo@fincompar.com') {
        savedInvestment = {
          ...newInvestment,
          id: generateId(),
          createdAt: new Date().toISOString()
        };
      } else {
        // Real mode: save to Supabase
        savedInvestment = await addInvestmentDB(newInvestment);
      }

      if (savedInvestment) {
        setInvestments([savedInvestment, ...investments]);
        setActiveTab('dashboard');
        setTransactionTypeSelected(null); // Reset transaction type selection
        addNotification('Investimento adicionado com sucesso!', 'success');
      } else {
        addNotification('Erro ao salvar investimento', 'error');
      }
    } catch (error) {
      addNotification('Erro ao adicionar investimento', 'error');
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addNotification('Imagem muito grande. Máximo: 2MB', 'warning');
      return;
    }

    if (!file.type.startsWith('image/')) {
      addNotification('Selecione uma imagem válida', 'warning');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
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

    setIsUploadingAvatar(true);
    try {
      let newAvatarUrl = user.avatar;

      // Upload do avatar se selecionou uma foto nova
      if (avatarFile && user.email !== 'demo@fincompar.com') {
        const url = await uploadAvatar(user.id, avatarFile);
        if (url) newAvatarUrl = url;
      }

      // Salvar no banco (se nao for demo)
      if (user.email !== 'demo@fincompar.com') {
        await updateUserProfile(user.id, {
          name: userName.trim(),
          avatar: newAvatarUrl,
        });
      }

      setUser((prev) => ({ ...prev, name: userName.trim(), email: userEmail.trim(), avatar: newAvatarUrl }));
      setIsEditingUser(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      addNotification('Perfil atualizado com sucesso!', 'success');
    } catch {
      addNotification('Erro ao atualizar perfil', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
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

  // Filter transactions by period
  // Processar dados para gráfico de pizza
  const getChartData = (type: 'income' | 'expense') => {
    const colors = type === 'income'
      ? ['#10B981', '#059669', '#047857', '#065F46'] // Green shades
      : ['#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D', '#F59E0B', '#D97706']; // Red + Orange shades

    const relevantTransactions = transactions.filter(t => t.type === type);
    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

    const categoryTotals = categories.map((cat, index) => {
      const total = relevantTransactions
        .filter(t => t.category === cat.name)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        category: cat.name,
        value: total,
        icon: cat.icon,
        color: colors[index % colors.length]
      };
    }).filter(item => item.value > 0); // Apenas categorias com valores

    return categoryTotals;
  };

  const filterTransactionsByPeriod = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (periodFilter) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) return transactions;
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        break;
      default:
        return transactions;
    }

    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  };

  const renderTransactions = () => {
    const filteredTransactions = filterTransactionsByPeriod();

    return (
      <div className="space-y-6 animate-fadeIn pb-10">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-gray-800 dark:text-white">Histórico</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
            {filteredTransactions.length} transações
          </p>
        </div>

        {/* Filtro de Período */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Período</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPeriodFilter('week')}
              className={`py-3 px-4 rounded-2xl font-bold text-sm transition-all ${
                periodFilter === 'week'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/30'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setPeriodFilter('month')}
              className={`py-3 px-4 rounded-2xl font-bold text-sm transition-all ${
                periodFilter === 'month'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/30'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setPeriodFilter('year')}
              className={`py-3 px-4 rounded-2xl font-bold text-sm transition-all ${
                periodFilter === 'year'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/30'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Anual
            </button>
            <button
              onClick={() => setPeriodFilter('custom')}
              className={`py-3 px-4 rounded-2xl font-bold text-sm transition-all ${
                periodFilter === 'custom'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/30'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Personalizado
            </button>
          </div>

          {/* Custom Date Range */}
          {periodFilter === 'custom' && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label htmlFor="startDate" className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">
                  Data Inicial
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-xl py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">
                  Data Final
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-xl py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Lista de Transações */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] text-center border border-gray-100 dark:border-gray-700">
              <p className="text-gray-400 dark:text-gray-500 font-bold">Nenhuma transação neste período</p>
            </div>
          ) : (
            filteredTransactions.map(t => (
              <div key={t.id} className="bg-white dark:bg-gray-800 p-4 rounded-3xl flex items-center justify-between gap-3 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
                    t.type === 'income' ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'
                  }`}>
                    {(t.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).find(c => c.name === t.category)?.icon || '💰'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-800 dark:text-white text-sm truncate">{t.description}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest truncate">
                      {t.category} • {new Date(t.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-black text-sm whitespace-nowrap ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest whitespace-nowrap">
                    {t.payerId === 'user_1' || t.payerId === 'demo-user-id' ? user.name.split(' ')[0] : partner.name.split(' ')[0]}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="bg-purple-600 dark:bg-purple-700 rounded-[2rem] p-7 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <p className="text-purple-100 dark:text-purple-200 text-sm font-semibold mb-1 opacity-80">Saldo total do casal</p>
        <div className="flex items-end gap-2">
          <h2 className="text-4xl font-black">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          <div className="mb-2 bg-green-400 w-2 h-2 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
        </div>

        <div className="space-y-3 mt-8">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowChartModal('income')}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-left active:scale-95 transition-all"
            >
              <p className="text-[10px] uppercase font-black text-purple-100 dark:text-purple-200 mb-1 tracking-widest flex items-center gap-1">
                Entradas <span className="text-sm">📈</span>
              </p>
              <p className="font-bold text-lg text-green-300">R$ {totalIncome.toLocaleString('pt-BR')}</p>
            </button>
            <button
              onClick={() => setShowChartModal('expense')}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-left active:scale-95 transition-all"
            >
              <p className="text-[10px] uppercase font-black text-purple-100 dark:text-purple-200 mb-1 tracking-widest flex items-center gap-1">
                Saídas <span className="text-sm">📉</span>
              </p>
              <p className="font-bold text-lg text-red-300">R$ {totalExpense.toLocaleString('pt-BR')}</p>
            </button>
          </div>

          <button
            onClick={() => setShowInvestmentsModal(true)}
            className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-left active:scale-95 transition-all"
          >
            <p className="text-[10px] uppercase font-black text-purple-100 dark:text-purple-200 mb-1 tracking-widest flex items-center gap-1">
              Investido <span className="text-sm">💰</span>
            </p>
            <p className="font-bold text-lg text-yellow-300">R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </button>
        </div>
      </div>

      <button
        onClick={() => setShowSummary(true)}
        className="w-full bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700 rounded-3xl p-5 flex items-center justify-between shadow-sm active:scale-95 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-purple-500 to-indigo-500 p-3 rounded-2xl text-white shadow-md shadow-purple-200 dark:shadow-purple-900/30">
            <Sparkles size={22} />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-tighter">Fincompar AI</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold line-clamp-1">Você economizou 12% a mais que o mês passado!</p>
          </div>
        </div>
        <ChevronRight size={20} className="text-gray-300 dark:text-gray-600" />
      </button>

      <div>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-black text-gray-800 dark:text-white tracking-tight text-lg">Suas Metas</h3>
          <ArrowRight size={20} className="text-purple-600 dark:text-purple-400" onClick={() => setActiveTab('goals')} />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-purple">
          {goals.map(goal => (
            <div key={goal.id} className="min-w-[260px] bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Target size={20} />
                </div>
                <p className="font-bold text-gray-700 dark:text-gray-300 truncate">{goal.name}</p>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-purple-600 dark:bg-purple-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                  {((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}% completos
                </p>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">R$ {goal.targetAmount.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-black text-gray-800 dark:text-white tracking-tight text-lg mb-4 px-1">Gastos Recentes</h3>
        <div className="space-y-3">
          {transactions.slice(0, 4).map(t => (
            <div key={t.id} className="bg-white dark:bg-gray-800 p-4 rounded-3xl flex items-center justify-between shadow-sm active:bg-gray-50 dark:active:bg-gray-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
                  t.type === 'income' ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'
                }`}>
                  {CATEGORIES.find(c => c.name === t.category)?.icon || '💰'}
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white text-sm">{t.description}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                    {t.category} • {t.payerId === 'user_1' ? user.name.split(' ')[0] : partner.name.split(' ')[0]}
                  </p>
                </div>
              </div>
              <p className={`font-black text-base ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-white'}`}>
                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAdd = () => {
    // Step 1: Choose transaction type (Gasto ou Ganho)
    if (transactionTypeSelected === null) {
      return (
        <div className="animate-slideUp pb-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white">Novo Registro</h2>
            <button
              onClick={() => setActiveTab('dashboard')}
              aria-label="Fechar"
              className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full active:scale-95 transition-all text-gray-800 dark:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 text-center mb-6 uppercase tracking-widest">
              O que você quer registrar?
            </p>

            {/* Botão Gasto */}
            <button
              onClick={() => setTransactionTypeSelected('expense')}
              className="w-full bg-gradient-to-br from-red-500 to-pink-600 text-white p-8 rounded-[2.5rem] shadow-xl shadow-red-200 dark:shadow-red-900/30 active:scale-95 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-2xl">
                    <TrendingDown size={32} className="text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-black">Gasto</h3>
                    <p className="text-sm font-medium opacity-90">Despesas e saídas</p>
                  </div>
                </div>
                <ChevronRight size={28} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>

            {/* Botão Ganho */}
            <button
              onClick={() => setTransactionTypeSelected('income')}
              className="w-full bg-gradient-to-br from-green-500 to-emerald-600 text-white p-8 rounded-[2.5rem] shadow-xl shadow-green-200 dark:shadow-green-900/30 active:scale-95 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-2xl">
                    <TrendingUp size={32} className="text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-black">Ganho</h3>
                    <p className="text-sm font-medium opacity-90">Receitas e entradas</p>
                  </div>
                </div>
                <ChevronRight size={28} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>

            {/* Botão Investimento */}
            <button
              onClick={() => setTransactionTypeSelected('investment')}
              className="w-full bg-gradient-to-br from-yellow-500 to-amber-600 text-white p-8 rounded-[2.5rem] shadow-xl shadow-yellow-200 dark:shadow-yellow-900/30 active:scale-95 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-2xl">
                    <Wallet size={32} className="text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-black">Investimento</h3>
                    <p className="text-sm font-medium opacity-90">Aportes e aplicações</p>
                  </div>
                </div>
                <ChevronRight size={28} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          </div>
        </div>
      );
    }

    // Step 2: Show form based on selected type
    if (transactionTypeSelected === 'investment') {
      // Formulário de Investimento
      return (
        <div className="animate-slideUp pb-10">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setTransactionTypeSelected(null)}
              aria-label="Voltar"
              className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full active:scale-95 transition-all text-gray-800 dark:text-white"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h2 className="text-2xl font-black text-gray-800 dark:text-white">Novo Investimento</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                Registre seu aporte
              </p>
            </div>
          </div>

          <form onSubmit={handleAddInvestment} className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
              <div>
                <label htmlFor="investmentAmount" className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-4">
                  Valor Investido
                </label>
                <div className="flex items-center gap-3 border-b-2 border-yellow-100 dark:border-yellow-900 pb-2 focus-within:border-yellow-600 transition-all">
                  <span className="text-2xl font-black text-gray-300 dark:text-gray-600" aria-hidden="true">R$</span>
                  <input
                    id="investmentAmount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="10000000"
                    required
                    autoFocus
                    aria-label="Valor investido em reais"
                    className="w-full bg-transparent border-0 outline-none text-4xl font-black text-yellow-600 dark:text-yellow-400 placeholder:text-gray-100 dark:placeholder:text-gray-700"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="investmentDescription" className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">
                  Descrição (Nome do Ativo)
                </label>
                <input
                  id="investmentDescription"
                  name="description"
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Ex: PETR4, Bitcoin, Tesouro Selic 2030"
                  aria-label="Nome do ativo"
                  className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl py-4 px-5 font-bold focus:ring-2 focus:ring-yellow-500 outline-none text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="investmentCategory" className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">
                  Categoria
                </label>
                <select
                  id="investmentCategory"
                  name="category"
                  aria-label="Categoria do investimento"
                  className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl py-4 px-5 font-bold focus:ring-2 focus:ring-yellow-500 outline-none appearance-none text-gray-900 dark:text-white"
                >
                  {INVESTMENT_CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="investmentPlatform" className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">
                  Plataforma
                </label>
                <input
                  id="investmentPlatform"
                  name="platform"
                  type="text"
                  required
                  maxLength={50}
                  placeholder="Ex: XP, Rico, Binance, NuInvest"
                  aria-label="Plataforma utilizada"
                  className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl py-4 px-5 font-bold focus:ring-2 focus:ring-yellow-500 outline-none text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="investmentQuantity" className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">
                  Quantidade (Opcional)
                </label>
                <input
                  id="investmentQuantity"
                  name="quantity"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="Ex: 10 (ações, cotas, etc)"
                  aria-label="Quantidade de cotas ou ações"
                  className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl py-4 px-5 font-bold focus:ring-2 focus:ring-yellow-500 outline-none text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="investmentDate" className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">
                  Data do Investimento
                </label>
                <input
                  id="investmentDate"
                  name="date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  aria-label="Data do investimento"
                  className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl py-4 px-5 font-bold focus:ring-2 focus:ring-yellow-500 outline-none text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              aria-label="Salvar investimento"
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-yellow-200 dark:shadow-yellow-900/30 active:scale-95 transition-all text-lg tracking-tight"
            >
              Salvar Investimento
            </button>
          </form>
        </div>
      );
    }

    // Formulário de Transação (Gasto ou Ganho)
    const categories = transactionTypeSelected === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const typeLabel = transactionTypeSelected === 'expense' ? 'Gasto' : 'Ganho';
    const typeColor = transactionTypeSelected === 'expense' ? 'red' : 'green';

    return (
      <div className="animate-slideUp pb-10">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setTransactionTypeSelected(null)}
            aria-label="Voltar"
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full active:scale-95 transition-all text-gray-800 dark:text-white"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-white">Novo {typeLabel}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
              {typeLabel === 'Gasto' ? 'Despesas e saídas' : 'Receitas e entradas'}
            </p>
          </div>
        </div>

        <form onSubmit={handleAddTransaction} className="space-y-6">
          <input type="hidden" name="type" value={transactionTypeSelected} />

          <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
            <div>
              <label htmlFor="transactionAmount" className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-4">
                Valor
              </label>
              <div className={`flex items-center gap-3 border-b-2 border-${typeColor}-100 dark:border-${typeColor}-900 pb-2 focus-within:border-${typeColor}-600 transition-all`}>
                <span className="text-2xl font-black text-gray-300 dark:text-gray-600" aria-hidden="true">R$</span>
                <input
                  id="transactionAmount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1000000"
                  required
                  autoFocus
                  aria-label="Valor em reais"
                  className={`w-full bg-transparent border-0 outline-none text-4xl font-black text-${typeColor}-600 dark:text-${typeColor}-400 placeholder:text-gray-100 dark:placeholder:text-gray-700`}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div>
              <label htmlFor="transactionDesc" className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">
                Descrição
              </label>
              <input
                id="transactionDesc"
                name="description"
                type="text"
                required
                maxLength={100}
                aria-label="Descrição"
                className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl py-4 px-5 font-bold focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
                placeholder={typeLabel === 'Gasto' ? 'Ex: Jantar de sexta' : 'Ex: Salário do mês'}
              />
            </div>

            <div>
              <label htmlFor="transactionCategory" className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">
                Categoria
              </label>
              <select
                id="transactionCategory"
                name="category"
                aria-label="Categoria"
                className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl py-4 px-5 font-bold focus:ring-2 focus:ring-purple-500 outline-none appearance-none text-gray-900 dark:text-white"
              >
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="transactionDate" className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">
                Data
              </label>
              <input
                id="transactionDate"
                name="date"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                aria-label="Data da transação"
                className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl py-4 px-5 font-bold focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            aria-label="Salvar"
            className={`w-full bg-gradient-to-r from-${typeColor}-500 to-${typeColor}-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-${typeColor}-200 dark:shadow-${typeColor}-900/30 active:scale-95 transition-all text-lg tracking-tight`}
          >
            Salvar {typeLabel}
          </button>
        </form>
      </div>
    );
  };

  const renderGoals = () => (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-black text-gray-800 dark:text-white">Nossas Metas</h2>
        <button
          onClick={() => setIsAddingGoal(true)}
          aria-label="Adicionar nova meta"
          className="bg-purple-600 dark:bg-purple-700 text-white p-3 rounded-2xl shadow-lg shadow-purple-200 dark:shadow-purple-900/30 active:scale-95 transition-all"
        >
          <Plus size={22} />
        </button>
      </div>
      <div className="space-y-5">
        {goals.map(goal => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          return (
            <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-7 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-3xl text-purple-600 dark:text-purple-400">
                    <Target size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white text-xl">{goal.name}</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Alvo: R$ {goal.targetAmount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full">
                   <p className="text-purple-600 dark:text-purple-400 font-black text-xs">{progress.toFixed(0)}%</p>
                </div>
              </div>

              <div className="w-full h-4 bg-gray-50 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center gap-2 mb-1">
                    <img src={user.avatar} className="w-4 h-4 rounded-full" />
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase">{user.name.split(' ')[0]}</p>
                  </div>
                  <p className="text-base font-black text-gray-700 dark:text-gray-300">R$ {(goal.contributions['user_1'] || 0).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center gap-2 mb-1">
                    <img src={partner.avatar} className="w-4 h-4 rounded-full" />
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase">{partner.name.split(' ')[0]}</p>
                  </div>
                  <p className="text-base font-black text-gray-700 dark:text-gray-300">R$ {(goal.contributions['user_2'] || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setContributionGoal(goal)}
                  className="flex-1 bg-gray-900 dark:bg-gray-700 text-white font-black py-4 rounded-2xl hover:bg-black dark:hover:bg-gray-600 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-gray-200 dark:shadow-gray-900/30"
                >
                  <Coins size={18} /> Contribuir
                </button>
                <button
                  onClick={() => setGoalToDelete(goal)}
                  className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 font-black p-4 rounded-2xl active:scale-95 transition-all border border-red-100 dark:border-red-900/40"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="px-1">
        <h2 className="text-2xl font-black text-gray-800 dark:text-white">Ajustes & Parceria</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 font-semibold italic">Seu ecossistema Fincompar</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700">
         <div className="flex items-center gap-5 mb-6">
            <img src={user.avatar} className="w-20 h-20 rounded-[2rem] border-4 border-purple-50 dark:border-purple-900/30 shadow-lg object-cover" />
            <div className="flex-1">
               <h3 className="font-black text-gray-800 dark:text-white text-xl leading-tight">{user.name}</h3>
               <p className="text-xs text-purple-500 dark:text-purple-400 font-bold mb-3">{user.email}</p>
               <button
                  onClick={() => setIsEditingUser(true)}
                  className="px-4 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-black uppercase tracking-wider active:bg-purple-100 dark:active:bg-purple-900/50 transition-colors"
               >
                  Editar Perfil
               </button>
            </div>
         </div>
         <div className="space-y-1">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl active:bg-gray-100 dark:active:bg-gray-600 transition-colors">
               <div className="flex items-center gap-3">
                  <Bell size={18} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Notificações</span>
               </div>
               <div className="w-10 h-6 bg-purple-600 rounded-full p-1 flex justify-end">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
               </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl active:bg-gray-100 dark:active:bg-gray-600 transition-colors">
               <div className="flex items-center gap-3">
                  <CreditCard size={18} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Meus Cartões</span>
               </div>
               <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
            </div>
            <button
               onClick={toggleDarkMode}
               className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl active:bg-gray-100 dark:active:bg-gray-600 transition-colors w-full"
            >
               <div className="flex items-center gap-3">
                  <div className="text-gray-400 dark:text-gray-500">{isDarkMode ? '🌙' : '☀️'}</div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Modo {isDarkMode ? 'Escuro' : 'Claro'}</span>
               </div>
               <div className={`w-10 h-6 rounded-full p-1 flex transition-all ${isDarkMode ? 'bg-purple-600 justify-end' : 'bg-gray-300 justify-start'}`}>
                  <div className="w-4 h-4 bg-white rounded-full"></div>
               </div>
            </button>
         </div>
      </div>

      {user.partnerId && partner?.id ? (
        <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-[2.5rem] p-7 text-white shadow-xl shadow-green-100 dark:shadow-green-900/30">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-xl flex items-center gap-2"><Heart size={22} fill="white" /> Meu amor</h3>
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
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-pink-50 dark:bg-pink-900/30 p-3 rounded-2xl">
              <Heart size={22} className="text-pink-500 dark:text-pink-400" />
            </div>
            <div>
              <h3 className="font-black text-gray-800 dark:text-white text-lg">Vincular Parceiro(a)</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold">Compartilhem metas e finanças juntos</p>
            </div>
          </div>

          {receivedInvitations.length > 0 && (
            <div className="mb-4 space-y-3">
              <p className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">Convites recebidos</p>
              {receivedInvitations.map(inv => (
                <div key={inv.id} className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-900/40">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-xl">
                      <UserPlus size={18} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-gray-800 dark:text-white text-sm">{inv.senderName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold">{inv.senderEmail}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptInvite(inv)}
                      className="flex-1 bg-green-500 dark:bg-green-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Check size={14} /> Aceitar
                    </button>
                    <button
                      onClick={() => handleRejectInvite(inv.id)}
                      className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-black py-3 rounded-xl text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <X size={14} /> Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {sentInvitations.length > 0 && (
            <div className="mb-4 space-y-3">
              <p className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider">Convites enviados</p>
              {sentInvitations.map(inv => (
                <div key={inv.id} className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 border border-orange-100 dark:border-orange-900/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-100 dark:bg-orange-900/40 p-2 rounded-xl">
                        <Clock size={16} className="text-orange-500 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white text-sm">{inv.receiverEmail}</p>
                        <p className="text-[10px] text-orange-500 dark:text-orange-400 font-black uppercase tracking-wider">Aguardando resposta</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelInvite(inv.id)}
                      className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 active:scale-90 transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowInvitePartner(true)}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 text-white font-black py-4 rounded-2xl active:scale-95 transition-all text-sm tracking-widest flex items-center justify-center gap-2"
          >
            <Send size={16} /> ENVIAR CONVITE
          </button>
        </div>
      )}

      <button
        onClick={() => setActiveTab('explore')}
        className="w-full bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 rounded-[2.5rem] p-6 text-white shadow-xl shadow-purple-100 dark:shadow-purple-900/30 active:scale-[0.98] transition-all text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <Compass size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg">Explorar</h3>
              <p className="text-purple-200 text-xs font-semibold">Dicas, artigos e mais</p>
            </div>
          </div>
          <ChevronRight size={22} className="opacity-60" />
        </div>
      </button>

      <button
        onClick={handleLogout}
        aria-label="Encerrar sessão"
        className="w-full py-5 rounded-3xl border-2 border-red-50 dark:border-red-900/30 text-red-500 dark:text-red-400 font-black text-xs uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-3"
      >
        <LogOut size={16} /> Encerrar Sessão
      </button>
    </div>
  );

  const renderTips = () => (
    <div className="space-y-6 animate-fadeIn pb-10">
      <button
        onClick={() => setActiveTab('explore')}
        className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm active:opacity-60 transition-opacity"
      >
        <ArrowLeft size={18} /> Voltar ao Explorar
      </button>

      <div className="px-1">
        <h2 className="text-2xl font-black text-gray-800 dark:text-white">Dicas Fincompar</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 font-semibold italic">Aprenda a gerenciar melhor suas finanças</p>
      </div>

      <div className="space-y-4">
        {EDUCATIONAL_CONTENT.map(content => (
          <div key={content.id} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-700 transition-colors">
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-2xl ${content.type === 'audio' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400' : 'bg-green-50 dark:bg-green-900/30 text-green-500 dark:text-green-400'}`}>
                {content.type === 'audio' ? <Play size={24} /> : <FileText size={24} />}
              </div>
              <div className="flex-1">
                <h3 className="font-black text-gray-800 dark:text-white text-lg mb-1">{content.title}</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tight mb-3">
                  {content.type === 'audio' ? '🎧 Dica em áudio • 1min' : '📖 Texto curto • 2min'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                  {content.description}
                </p>
              </div>
            </div>
            <button
              onClick={() => content.type === 'audio' && playAudioTip(content.content)}
              className="w-full bg-purple-600 text-white font-black py-4 rounded-2xl active:scale-95 transition-all text-sm tracking-widest flex items-center justify-center gap-2"
            >
              {content.type === 'audio' ? <><Play size={18} /> OUVIR DICA</> : <><FileText size={18} /> LER CONTEÚDO</>}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 rounded-[2.5rem] p-7 text-white shadow-xl shadow-purple-100 dark:shadow-purple-900/30">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles size={28} />
          <h3 className="font-black text-xl">Em breve: Mais conteúdo!</h3>
        </div>
        <p className="text-purple-100 dark:text-purple-200 font-medium leading-relaxed">
          Estamos preparando artigos, vídeos e podcasts exclusivos para ajudar você e seu parceiro a alcançarem a liberdade financeira juntos!
        </p>
      </div>
    </div>
  );

  const EXPLORE_ITEMS = [
    {
      id: 'tips',
      title: 'Dicas Financeiras',
      description: 'Áudios e textos para melhorar suas finanças',
      icon: <BookOpen size={24} />,
      color: 'from-purple-500 to-indigo-500',
      bgLight: 'bg-purple-50 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400',
      available: true,
    },
    {
      id: 'articles',
      title: 'Artigos',
      description: 'Conteúdo aprofundado sobre finanças a dois',
      icon: <Newspaper size={24} />,
      color: 'from-blue-500 to-cyan-500',
      bgLight: 'bg-blue-50 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      available: false,
    },
    {
      id: 'podcasts',
      title: 'Podcasts',
      description: 'Episódios sobre economia doméstica',
      icon: <Headphones size={24} />,
      color: 'from-orange-500 to-red-500',
      bgLight: 'bg-orange-50 dark:bg-orange-900/30',
      textColor: 'text-orange-600 dark:text-orange-400',
      available: false,
    },
    {
      id: 'tools',
      title: 'Ferramentas',
      description: 'Calculadoras e simuladores financeiros',
      icon: <Wrench size={24} />,
      color: 'from-green-500 to-emerald-500',
      bgLight: 'bg-green-50 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400',
      available: false,
    },
  ];

  const renderExplore = () => (
    <div className="space-y-6 animate-fadeIn pb-10">
      <button
        onClick={() => setActiveTab('profile')}
        className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm active:opacity-60 transition-opacity"
      >
        <ArrowLeft size={18} /> Voltar ao Perfil
      </button>

      <div className="px-1">
        <h2 className="text-2xl font-black text-gray-800 dark:text-white">Explorar</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 font-semibold italic">Conteúdos e ferramentas para o casal</p>
      </div>

      <div className="space-y-4">
        {EXPLORE_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => item.available && setActiveTab(item.id)}
            className={`w-full bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-all text-left ${
              item.available ? 'active:scale-[0.98]' : 'opacity-60'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${item.bgLight} ${item.textColor}`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-gray-800 dark:text-white text-base">{item.title}</h3>
                  {!item.available && (
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock size={10} /> Em breve
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold mt-1">{item.description}</p>
              </div>
              {item.available && <ChevronRight size={20} className="text-gray-300 dark:text-gray-600" />}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 rounded-[2.5rem] p-7 text-white shadow-xl shadow-purple-100 dark:shadow-purple-900/30">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles size={28} />
          <h3 className="font-black text-xl">Novidades a caminho!</h3>
        </div>
        <p className="text-purple-100 dark:text-purple-200 font-medium leading-relaxed">
          Estamos preparando artigos, podcasts e ferramentas exclusivas para ajudar você e seu parceiro a alcançarem a liberdade financeira juntos!
        </p>
      </div>
    </div>
  );

  const getActiveTabContent = () => {
    switch(activeTab) {
      case 'dashboard': return renderDashboard();
      case 'transactions': return renderTransactions();
      case 'add': return renderAdd();
      case 'goals': return renderGoals();
      case 'profile': return renderProfile();
      case 'explore': return renderExplore();
      case 'tips': return renderTips();
      default: return renderDashboard();
    }
  };

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const hasNoProfilePicture = !user.avatar || user.avatar.includes('unsplash.com');
  const hasNoGoals = goals.length === 0;

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title="Fincompar"
      showProfileNotification={hasNoProfilePicture}
      showGoalsNotification={hasNoGoals}
    >
      <NotificationContainer notifications={notifications} onClose={removeNotification} />
      <ConfigWarning />
      {getActiveTabContent()}

      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px] p-4 transition-all duration-300">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-slideUp">
            <div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-8"></div>
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-3xl text-purple-600 dark:text-purple-400 shadow-sm">
                <Sparkles size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Análise IA</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Resumo do Mês</p>
              </div>
            </div>
            <div className="bg-purple-50/50 dark:bg-purple-900/20 p-6 rounded-[2rem] border border-purple-100 dark:border-purple-800 mb-8">
               <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic text-lg">"{aiSummary}"</p>
            </div>
            <button
              onClick={() => setShowSummary(false)}
              aria-label="Fechar análise da IA"
              className="w-full bg-gray-900 dark:bg-gray-700 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-gray-200 dark:shadow-gray-900/30 active:scale-95 transition-all"
            >
              Entendido!
            </button>
          </div>
        </div>
      )}

      {contributionGoal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-slideUp">
            <div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-8"></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-3xl text-green-600 dark:text-green-400">
                <Coins size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Contribuir</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">{contributionGoal.name}</p>
              </div>
            </div>

            <form onSubmit={handleContribution} className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <label className="cursor-pointer group">
                  <input type="radio" name="contributor" value="user_1" defaultChecked className="hidden peer" />
                  <div className="flex flex-col items-center p-5 rounded-[2rem] border-2 border-gray-50 dark:border-gray-700 peer-checked:border-purple-600 peer-checked:bg-purple-50 dark:peer-checked:bg-purple-900/30 transition-all shadow-sm">
                    <img src={user.avatar} className="w-14 h-14 rounded-2xl mb-3 object-cover shadow-md" />
                    <span className="font-black text-xs text-gray-700 dark:text-gray-300 uppercase">{user.name.split(' ')[0]}</span>
                  </div>
                </label>
                <label className="cursor-pointer group">
                  <input type="radio" name="contributor" value="user_2" className="hidden peer" />
                  <div className="flex flex-col items-center p-5 rounded-[2rem] border-2 border-gray-50 dark:border-gray-700 peer-checked:border-purple-600 peer-checked:bg-purple-50 dark:peer-checked:bg-purple-900/30 transition-all shadow-sm">
                    <img src={partner.avatar} className="w-14 h-14 rounded-2xl mb-3 object-cover shadow-md" />
                    <span className="font-black text-xs text-gray-700 dark:text-gray-300 uppercase">{partner.name.split(' ')[0]}</span>
                  </div>
                </label>
              </div>

              <div>
                <label htmlFor="contributionAmount" className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">
                  Quanto vai guardar?
                </label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 font-black text-xl" aria-hidden="true">
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
                    className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-[2rem] py-6 pl-16 pr-6 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/50 font-black text-3xl text-purple-600 dark:text-purple-400 outline-none"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                 <button
                   type="button"
                   onClick={() => setContributionGoal(null)}
                   aria-label="Cancelar contribuição"
                   className="flex-1 py-5 bg-gray-100 dark:bg-gray-700 rounded-[2rem] font-black text-gray-500 dark:text-gray-300 uppercase text-xs active:bg-gray-200 dark:active:bg-gray-600"
                 >
                   Cancelar
                 </button>
                 <button
                   type="submit"
                   aria-label="Confirmar contribuição"
                   className="flex-[2] bg-purple-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-purple-100 dark:shadow-purple-900/30 active:scale-95 transition-all text-sm uppercase tracking-widest"
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
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-slideUp">
            <div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-8"></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-3xl text-purple-600 dark:text-purple-400">
                <Edit2 size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Editar Perfil</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Atualize seus dados</p>
              </div>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-3">
                  <img
                    src={avatarPreview || user.avatar}
                    className="w-24 h-24 rounded-[2rem] border-4 border-purple-100 dark:border-purple-900/30 shadow-lg object-cover"
                    alt="Avatar"
                  />
                  <label className="absolute -bottom-2 -right-2 bg-purple-600 text-white p-2.5 rounded-xl cursor-pointer active:scale-90 transition-all shadow-lg">
                    <Camera size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                {avatarPreview && (
                  <p className="text-xs text-green-500 dark:text-green-400 font-bold">Nova foto selecionada</p>
                )}
                {!avatarPreview && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold">Toque no icone para trocar a foto</p>
                )}
              </div>
              <input
                name="userName"
                type="text"
                defaultValue={user.name}
                required
                maxLength={100}
                aria-label="Seu nome"
                className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl py-5 px-6 font-bold outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                placeholder="Seu nome"
              />
              <input
                name="userEmail"
                type="email"
                defaultValue={user.email}
                required
                aria-label="Seu e-mail"
                className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl py-5 px-6 font-bold outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                placeholder="Seu e-mail"
              />
              <button
                type="submit"
                disabled={isUploadingAvatar}
                aria-label="Atualizar perfil"
                className="w-full bg-purple-600 text-white font-black py-5 rounded-[2rem] active:scale-95 transition-all text-sm tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploadingAvatar ? <><Loader2 size={18} className="animate-spin" /> SALVANDO...</> : 'ATUALIZAR MEU PERFIL'}
              </button>
              <button
                type="button"
                onClick={() => { setIsEditingUser(false); setAvatarFile(null); setAvatarPreview(null); }}
                aria-label="Voltar"
                className="w-full py-2 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest"
              >
                Voltar
              </button>
            </form>
          </div>
        </div>
      )}

      {isEditingPartner && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-slideUp">
            <div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-8"></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-3xl text-green-600 dark:text-green-400">
                <Settings size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Editar Parceiro</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Sincronização em Tempo Real</p>
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
                className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl py-5 px-6 font-bold outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                placeholder="Nome do parceiro"
              />
              <input
                name="partnerEmail"
                type="email"
                defaultValue={partner.email}
                required
                aria-label="E-mail do parceiro"
                className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl py-5 px-6 font-bold outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
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
                onClick={() => {
                  setIsEditingPartner(false);
                  setShowRemovePartnerConfirmation(true);
                }}
                aria-label="Remover parceiro"
                className="w-full bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 font-black py-4 rounded-[2rem] active:scale-95 transition-all text-sm tracking-widest flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                REMOVER PARCEIRO
              </button>
              <button
                type="button"
                onClick={() => setIsEditingPartner(false)}
                aria-label="Voltar"
                className="w-full py-2 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest"
              >
                Voltar
              </button>
            </form>
          </div>
        </div>
      )}

      {showRemovePartnerConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-fadeIn">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="bg-red-100 dark:bg-red-900/30 p-6 rounded-full mb-6">
                <Heart size={48} className="text-red-500 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-3">Tem certeza disso?</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold leading-relaxed">
                Ao remover seu parceiro, todos os dados compartilhados serão mantidos, mas vocês não estarão mais sincronizados.
              </p>
              <p className="text-xs text-red-500 dark:text-red-400 font-bold mt-4 italic">
                Esta ação não pode ser desfeita facilmente.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  // Aqui você pode adicionar a lógica de remoção do parceiro
                  setPartner({...partner, partnerId: null});
                  setUser({...user, partnerId: null});
                  addNotification('Entendo, é uma pena 😔...', 'info');
                  setShowRemovePartnerConfirmation(false);
                }}
                aria-label="Confirmar remoção"
                className="w-full bg-red-600 dark:bg-red-700 text-white font-black py-5 rounded-[2rem] active:scale-95 transition-all text-sm tracking-widest"
              >
                SIM, REMOVER PARCEIRO
              </button>
              <button
                onClick={() => setShowRemovePartnerConfirmation(false)}
                aria-label="Cancelar"
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white font-black py-5 rounded-[2rem] active:scale-95 transition-all text-sm tracking-widest"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvitePartner && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-slideUp">
            <div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-8"></div>
            <button onClick={() => { setShowInvitePartner(false); setInviteEmail(''); }} className="absolute top-6 right-6 p-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={20} className="text-gray-400" />
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-pink-100 dark:bg-pink-900/30 p-4 rounded-3xl text-pink-500 dark:text-pink-400">
                <Heart size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Convidar Parceiro(a)</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold">Envie um convite para começar a compartilhar</p>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Email do parceiro(a)</label>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-2xl px-4">
                  <Mail size={18} className="text-gray-400 dark:text-gray-500" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="parceiro@email.com"
                    className="w-full py-4 bg-transparent text-gray-800 dark:text-white font-bold outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  />
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-900/40">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-bold leading-relaxed">
                  Seu parceiro(a) precisa ter uma conta no Fincompar. Ao aceitar o convite, vocês poderão compartilhar metas e acompanhar finanças juntos.
                </p>
              </div>
              <button
                onClick={handleSendInvite}
                disabled={isSendingInvite}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 text-white font-black py-5 rounded-[2rem] active:scale-95 transition-all text-sm tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSendingInvite ? <><Loader2 size={18} className="animate-spin" /> ENVIANDO...</> : <><Send size={18} /> ENVIAR CONVITE</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {goalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-fadeIn">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="bg-red-100 dark:bg-red-900/30 p-6 rounded-full mb-6">
                <Trash2 size={40} className="text-red-500 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-3">Excluir meta?</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold leading-relaxed">
                A meta <span className="font-black text-gray-800 dark:text-white">"{goalToDelete.name}"</span> será excluída permanentemente. Essa ação não pode ser desfeita.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleDeleteGoal}
                className="w-full bg-red-600 dark:bg-red-700 text-white font-black py-5 rounded-[2rem] active:scale-95 transition-all text-sm tracking-widest"
              >
                SIM, EXCLUIR META
              </button>
              <button
                onClick={() => setGoalToDelete(null)}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white font-black py-5 rounded-[2rem] active:scale-95 transition-all text-sm tracking-widest"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddingGoal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-slideUp">
            <div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-8"></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-3xl text-purple-600 dark:text-purple-400">
                <Target size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Nova Meta</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Objetivos em Casal</p>
              </div>
            </div>
            <form onSubmit={handleAddGoal} className="space-y-6">
              <div>
                <label htmlFor="goalName" className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">
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
                  className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl py-5 px-6 font-bold outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="targetAmount" className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">
                  Valor alvo
                </label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 font-black text-xl" aria-hidden="true">
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
                    className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-[2rem] py-6 pl-16 pr-6 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/50 font-black text-3xl text-purple-600 dark:text-purple-400 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingGoal(false)}
                  aria-label="Cancelar"
                  className="flex-1 py-5 bg-gray-100 dark:bg-gray-700 rounded-[2rem] font-black text-gray-500 dark:text-gray-300 uppercase text-xs active:bg-gray-200 dark:active:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  aria-label="Criar meta"
                  className="flex-[2] bg-purple-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-purple-100 dark:shadow-purple-900/30 active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                  Criar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChartModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-slideUp max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-8"></div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-3xl ${
                  showChartModal === 'income'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                }`}>
                  {showChartModal === 'income' ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
                    {showChartModal === 'income' ? 'Entradas' : 'Saídas'}
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                    Por Categoria
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowChartModal(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Fechar"
              >
                <X size={24} className="text-gray-400 dark:text-gray-500" />
              </button>
            </div>

            <PieChart
              data={getChartData(showChartModal)}
              title={showChartModal === 'income' ? 'Entradas' : 'Saídas'}
            />
          </div>
        </div>
      )}

      {showInvestmentsModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-slideUp max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-8"></div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-3xl text-yellow-600 dark:text-yellow-400">
                  <Wallet size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
                    Investimentos
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                    Total: R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInvestmentsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Fechar"
              >
                <X size={24} className="text-gray-400 dark:text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {investments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 dark:text-gray-500 font-bold mb-2">Nenhum investimento ainda</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Comece a investir e acompanhe seu patrimônio!</p>
                </div>
              ) : (
                (() => {
                  // Agrupar investimentos por descrição
                  const grouped = investments.reduce((acc, inv) => {
                    if (!acc[inv.description]) {
                      acc[inv.description] = {
                        description: inv.description,
                        category: inv.category,
                        totalAmount: 0,
                        totalQuantity: 0,
                        count: 0,
                        icon: INVESTMENT_CATEGORIES.find(c => c.name === inv.category)?.icon || '💰',
                      };
                    }
                    acc[inv.description].totalAmount += inv.amount;
                    acc[inv.description].totalQuantity += inv.quantity || 0;
                    acc[inv.description].count += 1;
                    return acc;
                  }, {} as Record<string, { description: string; category: string; totalAmount: number; totalQuantity: number; count: number; icon: string }>);

                  return Object.values(grouped).map((item, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-2xl flex-shrink-0">{item.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-800 dark:text-white truncate">{item.description}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">
                              {item.category} • {item.count} {item.count === 1 ? 'aporte' : 'aportes'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="font-black text-yellow-600 dark:text-yellow-400">
                            R$ {item.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          {item.totalQuantity > 0 && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                              {item.totalQuantity.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} cotas
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
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
