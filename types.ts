
export type Category = 'Alimentação' | 'Moradia' | 'Lazer' | 'Transporte' | 'Saúde' | 'Educação' | 'Outros';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string; // ISO 8601 format: YYYY-MM-DD
  category: Category;
  payerId: string;
  type: 'income' | 'expense';
  createdAt?: string; // ISO timestamp
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  contributions: Record<string, number>;
  createdAt?: string; // ISO timestamp
  deadline?: string; // ISO 8601 format: YYYY-MM-DD
}

export interface User {
  id: string;
  name: string;
  email: string;
  partnerId?: string | null;
  avatar: string;
}

export interface EducationalContent {
  id: string;
  title: string;
  description: string;
  type: 'text' | 'audio';
  content: string;
}

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

// Utility function to generate unique IDs
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};
