
export type Category = 'Alimentação' | 'Moradia' | 'Lazer' | 'Transporte' | 'Saúde' | 'Educação' | 'Outros';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  category: Category;
  payerId: string;
  type: 'income' | 'expense';
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  contributions: Record<string, number>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  partnerId?: string;
  avatar: string;
}

export interface EducationalContent {
  id: string;
  title: string;
  description: string;
  type: 'text' | 'audio';
  content: string;
}
