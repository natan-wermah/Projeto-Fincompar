
// Categorias de gastos (expenses)
export type ExpenseCategory = 'Alimentação' | 'Moradia' | 'Lazer' | 'Transporte' | 'Saúde' | 'Educação' | 'Outros';

// Categorias de ganhos (income)
export type IncomeCategory = 'Trabalho Principal' | 'Clientes' | 'Freelas' | 'Outros';

// Categoria pode ser qualquer uma das duas
export type Category = ExpenseCategory | IncomeCategory;

// Categorias de investimentos
export type InvestmentCategory = 'Ações' | 'FII' | 'ETF' | 'Cripto' | 'Renda Fixa' | 'Tesouro Direto' | 'CDB' | 'LCI/LCA' | 'Fundos' | 'Outros';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

// Método de pagamento
export type PaymentMethod = 'credit' | 'checking' | 'pix' | 'other';

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

export interface User {
  id: string;
  name: string;
  email: string;
  partnerId?: string | null;
  avatar: string;
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
