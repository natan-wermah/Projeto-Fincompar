
// Categorias são strings (padrão + customizadas pelo usuário)
export type Category = string;
export type InvestmentCategory = string;

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

// Método de pagamento
export type PaymentMethod = 'credit' | 'checking' | 'pix' | 'other';

// Origem da transação
export type TransactionSource = 'manual' | 'pluggy';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string; // ISO 8601 format: YYYY-MM-DD
  category: Category;
  payerId: string;
  type: 'income' | 'expense';
  paymentMethod?: PaymentMethod;
  isRefund?: boolean; // Estorno de cartão de crédito (subtrai dos gastos)
  source?: TransactionSource; // Origem: manual ou pluggy
  shared?: boolean;
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

export interface Investment {
  id: string;
  amount: number;
  description: string; // Nome do ativo (PETR4, Bitcoin, etc)
  category: InvestmentCategory;
  platform: string; // XP, Rico, Binance, etc
  quantity?: number; // Quantidade de cotas/ações (opcional)
  date: string; // ISO 8601 format: YYYY-MM-DD
  userId: string;
  createdAt?: string; // ISO timestamp
}

export interface CustomCategoryGroup {
  expense: { name: string; icon: string }[];
  income: { name: string; icon: string }[];
  investment: { name: string; icon: string }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  partnerId?: string | null;
  avatar: string;
  customCategories?: CustomCategoryGroup;
  pluggyItemId?: string | null;
}

export type InvitationStatus = 'pending' | 'accepted' | 'rejected';

export interface PartnerInvitation {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  receiverEmail: string;
  status: InvitationStatus;
  createdAt: string;
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
