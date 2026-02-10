import { supabase } from '../supabaseClient';
import { Transaction, Goal, User } from '../types';

// Transactions
export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`payerId.eq.${userId},payerId.eq.(SELECT partnerId FROM users WHERE id = ${userId})`)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction | null> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...transaction, createdAt: new Date().toISOString() }])
      .select()
      .single();

    if (error) throw error;
    return data;
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
      .or(`contributions->>${userId}.not.is.null`)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching goals:', error);
    return [];
  }
};

export const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal | null> => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .insert([{ ...goal, createdAt: new Date().toISOString() }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding goal:', error);
    return null;
  }
};

export const updateGoal = async (id: string, updates: Partial<Goal>): Promise<Goal | null> => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
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
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
};

export const getPartnerProfile = async (partnerId: string): Promise<User | null> => {
  if (!partnerId) return null;
  return getUserProfile(partnerId);
};
