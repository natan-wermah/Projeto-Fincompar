
import React from 'react';
import { 
  Home, 
  Plus, 
  Target, 
  BookOpen, 
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
  { id: 'transactions', label: 'Gastos', icon: <DollarSign size={24} /> },
  { id: 'add', label: '', icon: <Plus size={32} /> },
  { id: 'goals', label: 'Metas', icon: <Target size={24} /> },
  { id: 'profile', label: 'Perfil', icon: <UserIcon size={24} /> }
];

export const CATEGORIES: { name: string; icon: string }[] = [
  { name: 'Alimentação', icon: '🍕' },
  { name: 'Moradia', icon: '🏠' },
  { name: 'Lazer', icon: '🎬' },
  { name: 'Transporte', icon: '🚗' },
  { name: 'Saúde', icon: '🏥' },
  { name: 'Educação', icon: '📚' },
  { name: 'Outros', icon: '📦' }
];
