import PluggyClient from 'pluggy-js';
import type { Account } from 'pluggy-js';
import { Transaction as FincomparTransaction, Category, PaymentMethod } from '../types';

const PLUGGY_CLIENT_ID = import.meta.env.VITE_PLUGGY_CLIENT_ID;
const PLUGGY_CLIENT_SECRET = import.meta.env.VITE_PLUGGY_CLIENT_SECRET;
const PLUGGY_API_URL = 'https://api.pluggy.ai';

// ⚠️ NOTA DE SEGURANÇA: Em produção, mova a autenticação para um backend
// (Supabase Edge Function ou Vercel serverless). O CLIENT_SECRET não deve
// ficar exposto no frontend em produção.

let cachedApiKey: string | null = null;
let apiKeyExpiresAt: number = 0;

/**
 * Autentica com a API Pluggy e retorna o apiKey
 */
export const getPluggyApiKey = async (): Promise<string> => {
  // Usar cache se ainda válido (margem de 5min)
  if (cachedApiKey && Date.now() < apiKeyExpiresAt - 300000) {
    return cachedApiKey;
  }

  const response = await fetch(`${PLUGGY_API_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: PLUGGY_CLIENT_ID,
      clientSecret: PLUGGY_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error(`Pluggy auth failed: ${response.status}`);
  }

  const data = await response.json();
  cachedApiKey = data.apiKey;
  // API key dura 2h, guardamos o timestamp
  apiKeyExpiresAt = Date.now() + 2 * 60 * 60 * 1000;
  return cachedApiKey!;
};

/**
 * Cria um cliente Pluggy autenticado
 */
export const getPluggyClient = async (): Promise<PluggyClient> => {
  const apiKey = await getPluggyApiKey();
  return new PluggyClient(apiKey);
};

/**
 * Gera um connect token para o widget PluggyConnect
 */
export const createConnectToken = async (userId?: string): Promise<string> => {
  const client = await getPluggyClient();
  const { accessToken } = await client.createConnectToken(undefined, {
    clientUserId: userId,
  });
  return accessToken;
};

// Regex para identificar pagamento de fatura de cartão na conta corrente
// Cobre: pag fatura, pagto fatura, pagamento fatura, pagamento de fatura, pag*fatura,
//         pag cartão, pagamento cartao, fatura cart..., pgto cart...
const BILL_PAYMENT_REGEX = /pag\w*\s*[*\s]*(de\s+)?fatura|pag\w*\s+cart[aã]o|fatura\s+cart|pgto?\s+cart/i;

// Regex para identificar PIX
const PIX_REGEX = /\bpix\b/i;

/**
 * Busca todas as transações de um item (conta bancária conectada)
 * Separa por tipo de conta e filtra pagamentos de fatura
 */
export const fetchPluggyTransactions = async (
  itemId: string,
  payerId: string,
): Promise<FincomparTransaction[]> => {
  const client = await getPluggyClient();

  const accounts = await client.fetchAccounts(itemId);
  const allTransactions: FincomparTransaction[] = [];

  for (const account of accounts.results) {
    const now = new Date();
    const from = new Date('2026-01-01');

    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await client.fetchTransactions(account.id, {
        from: from.toISOString().split('T')[0],
        to: now.toISOString().split('T')[0],
        pageSize: 100,
        page,
      });

      for (const tx of response.results) {
        const mapped = mapPluggyTransaction(tx, payerId, account);
        // Filtrar pagamentos de fatura na conta corrente (evita duplicação)
        if (!mapped) continue;
        allTransactions.push(mapped);
      }

      hasMore = page < response.totalPages;
      page++;
    }
  }

  return allTransactions;
};

// Categorias que são sempre gasto
const EXPENSE_CATEGORY_NAMES = ['Alimentação', 'Moradia', 'Lazer', 'Transporte', 'Saúde', 'Educação'];
// Categorias que são sempre ganho
const INCOME_CATEGORY_NAMES = ['Trabalho Principal', 'Clientes', 'Freelas'];

/**
 * Mapeia uma transação do Pluggy para o formato Fincompar.
 * Retorna null se a transação deve ser ignorada (ex: pagamento de fatura).
 */
const mapPluggyTransaction = (
  tx: { id: string; description: string; amount: number; date: Date },
  payerId: string,
  account: Account,
): FincomparTransaction | null => {
  const isCreditCard = account.subtype === 'CREDIT_CARD';
  const desc = tx.description;

  // --- CONTA CORRENTE/POUPANÇA ---
  if (!isCreditCard) {
    // Ignorar pagamentos de fatura (evita gasto duplicado com o cartão)
    if (BILL_PAYMENT_REGEX.test(desc) && tx.amount < 0) {
      return null;
    }

    // Determinar método de pagamento: PIX ou conta corrente
    const paymentMethod: PaymentMethod = PIX_REGEX.test(desc) ? 'pix' : 'checking';

    const category = categorizeTransaction(desc);
    let type: 'income' | 'expense';
    if (EXPENSE_CATEGORY_NAMES.includes(category)) {
      type = 'expense';
    } else if (INCOME_CATEGORY_NAMES.includes(category)) {
      type = 'income';
    } else {
      type = tx.amount > 0 ? 'income' : 'expense';
    }

    return {
      id: `pluggy_${tx.id}`,
      amount: Math.abs(tx.amount),
      description: desc,
      date: new Date(tx.date).toISOString().split('T')[0],
      category,
      payerId,
      type,
      paymentMethod,
      isRefund: false,
      shared: false,
      createdAt: new Date().toISOString(),
    };
  }

  // --- CARTÃO DE CRÉDITO ---
  // Tudo do cartão é gasto. Valores positivos = estorno (reduz o gasto).
  const isRefund = tx.amount > 0;
  const category = categorizeTransaction(desc);

  return {
    id: `pluggy_${tx.id}`,
    amount: Math.abs(tx.amount),
    description: isRefund ? `Estorno: ${desc}` : desc,
    date: new Date(tx.date).toISOString().split('T')[0],
    category,
    payerId,
    type: 'expense',
    paymentMethod: 'credit',
    isRefund,
    shared: false,
    createdAt: new Date().toISOString(),
  };
};

/**
 * Categoriza automaticamente uma transação baseado na descrição
 */
const categorizeTransaction = (description: string): Category => {
  const desc = description.toLowerCase();

  // Alimentação
  if (/ifood|uber\s?eats|rappi|restaur|lanche|pizza|burger|mcdonald|subway|padaria|mercado|supermercado|hortifruti|açougue|carrefour|pão\s?de\s?açúcar|extra|assaí/i.test(desc)) {
    return 'Alimentação';
  }

  // Transporte
  if (/uber|99|lyft|cabify|combustível|gasolina|estaciona|pedágio|metrô|ônibus|bilhete\s?único|sem\s?parar/i.test(desc)) {
    return 'Transporte';
  }

  // Moradia
  if (/aluguel|condomínio|iptu|luz|energia|água|gás|internet|telefone|celular|vivo|claro|tim|oi\s/i.test(desc)) {
    return 'Moradia';
  }

  // Saúde
  if (/farmácia|drogaria|hospital|clínica|médic|consulta|exame|unimed|amil|sulamerica|hapvida|plano\s?de\s?saúde/i.test(desc)) {
    return 'Saúde';
  }

  // Educação
  if (/escola|faculdade|universidade|curso|udemy|alura|livro|livraria|mensalidade/i.test(desc)) {
    return 'Educação';
  }

  // Lazer
  if (/netflix|spotify|disney|hbo|prime\s?video|cinema|show|ingresso|viagem|hotel|airbnb|booking|game|steam|playstation|xbox|nintendo/i.test(desc)) {
    return 'Lazer';
  }

  // Trabalho (income patterns)
  if (/salário|salary|pagamento|pix\s?recebido|transferência\s?recebida|depósito/i.test(desc)) {
    return 'Trabalho Principal';
  }

  return 'Outros';
};

/**
 * Busca info do item conectado
 */
export const fetchPluggyItem = async (itemId: string) => {
  const client = await getPluggyClient();
  return client.fetchItem(itemId);
};

/**
 * Deleta um item conectado
 */
export const deletePluggyItem = async (itemId: string) => {
  const client = await getPluggyClient();
  return client.deleteItem(itemId);
};
