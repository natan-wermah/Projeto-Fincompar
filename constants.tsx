
import React from 'react';
import {
  Home,
  Plus,
  Target,
  Clock,
  User as UserIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart
} from 'lucide-react';

export const THEME = {
  primary: '#7C3AED', // Purple 600
  secondary: '#10B981', // Green 500
  white: '#FFFFFF',
  background: '#F9FAFB'
};

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Início', icon: <Home size={24} /> },
  { id: 'transactions', label: 'Histórico', icon: <Clock size={24} /> },
  { id: 'add', label: '', icon: <Plus size={32} /> },
  { id: 'goals', label: 'Metas', icon: <Target size={24} /> },
  { id: 'profile', label: 'Perfil', icon: <UserIcon size={24} /> }
];

// Categorias para GASTOS (expenses)
export const EXPENSE_CATEGORIES: { name: string; icon: string }[] = [
  { name: 'Alimentação', icon: '🍕' },
  { name: 'Moradia', icon: '🏠' },
  { name: 'Lazer', icon: '🎬' },
  { name: 'Transporte', icon: '🚗' },
  { name: 'Saúde', icon: '🏥' },
  { name: 'Educação', icon: '📚' },
  { name: 'Cartão', icon: '💳' },
  { name: 'Outros', icon: '📦' }
];

// Categorias para GANHOS (income)
export const INCOME_CATEGORIES: { name: string; icon: string }[] = [
  { name: 'Trabalho Principal', icon: '💼' },
  { name: 'Clientes', icon: '🤝' },
  { name: 'Freelas', icon: '💻' },
  { name: 'Outros', icon: '💰' }
];

// Manter compatibilidade com código antigo (por enquanto)
export const CATEGORIES = EXPENSE_CATEGORIES;

// Categorias para INVESTIMENTOS
export const INVESTMENT_CATEGORIES: { name: string; icon: string }[] = [
  { name: 'Ações', icon: '📈' },
  { name: 'FII', icon: '🏢' },
  { name: 'ETF', icon: '📊' },
  { name: 'Cripto', icon: '₿' },
  { name: 'Renda Fixa', icon: '💵' },
  { name: 'Tesouro Direto', icon: '🏛️' },
  { name: 'CDB', icon: '🏦' },
  { name: 'LCI/LCA', icon: '🏡' },
  { name: 'Fundos', icon: '💼' },
  { name: 'Outros', icon: '📦' }
];
