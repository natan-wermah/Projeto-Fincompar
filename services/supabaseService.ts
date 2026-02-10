import { supabase } from '../supabaseClient';
import { Transaction, Goal, User } from '../types';

// Transactions
export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`payer_id.eq.${userId}`)
      .order('date', { ascending: false });

    if (error) throw error;

    // Convert snake_case to camelCase
    return (data || []).map(item => ({
      id: item.id,
      amount: item.amount,
      description: item.description,
      date: item.date,
      category: item.category,
      payerId: item.payer_id,
      type: item.type,
      createdAt: item.created_at
    }));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction | null> => {
  try {
    // Convert camelCase to snake_case for database
    const dbTransaction = {
      amount: transaction.amount,
      description: transaction.description,
      date: transaction.date,
      category: transaction.category,
      payer_id: transaction.payerId,
      type: transaction.type,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([dbTransaction])
      .select()
      .single();

    if (error) throw error;

    // Convert snake_case back to camelCase
    return data ? {
      id: data.id,
      amount: data.amount,
      description: data.description,
      date: data.date,
      category: data.category,
      payerId: data.payer_id,
      type: data.type,
      createdAt: data.created_at
    } : null;
  } catch (error) {
    console.error('Error adding transaction:', error);
    return null;
  }
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
};

// Goals
export const getGoals = async (userId: string): Promise<Goal[]> => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Convert snake_case to camelCase
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      targetAmount: item.target_amount,
      currentAmount: item.current_amount,
      contributions: item.contributions || {},
      deadline: item.deadline,
      createdAt: item.created_at
    }));
  } catch (error) {
    console.error('Error fetching goals:', error);
    return [];
  }
};

export const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal | null> => {
  try {
    // Convert camelCase to snake_case
    const dbGoal = {
      name: goal.name,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount,
      contributions: goal.contributions,
      deadline: goal.deadline,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('goals')
      .insert([dbGoal])
      .select()
      .single();

    if (error) throw error;

    // Convert snake_case back to camelCase
    return data ? {
      id: data.id,
      name: data.name,
      targetAmount: data.target_amount,
      currentAmount: data.current_amount,
      contributions: data.contributions,
      deadline: data.deadline,
      createdAt: data.created_at
    } : null;
  } catch (error) {
    console.error('Error adding goal:', error);
    return null;
  }
};

export const updateGoal = async (id: string, updates: Partial<Goal>): Promise<Goal | null> => {
  try {
    // Convert camelCase to snake_case
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount;
    if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount;
    if (updates.contributions !== undefined) dbUpdates.contributions = updates.contributions;
    if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;

    const { data, error } = await supabase
      .from('goals')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Convert snake_case back to camelCase
    return data ? {
      id: data.id,
      name: data.name,
      targetAmount: data.target_amount,
      currentAmount: data.current_amount,
      contributions: data.contributions,
      deadline: data.deadline,
      createdAt: data.created_at
    } : null;
  } catch (error) {
    console.error('Error updating goal:', error);
    return null;
  }
};

export const deleteGoal = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting goal:', error);
    return false;
  }
};

// User Profile
export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Convert snake_case to camelCase
    return data ? {
      id: data.id,
      name: data.name,
      email: data.email,
      partnerId: data.partner_id,
      avatar: data.avatar
    } : null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  try {
    // Convert camelCase to snake_case
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.partnerId !== undefined) dbUpdates.partner_id = updates.partnerId;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;

    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Convert snake_case back to camelCase
    return data ? {
      id: data.id,
      name: data.name,
      email: data.email,
      partnerId: data.partner_id,
      avatar: data.avatar
    } : null;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
};

export const getPartnerProfile = async (partnerId: string): Promise<User | null> => {
  if (!partnerId) return null;
  return getUserProfile(partnerId);
};
