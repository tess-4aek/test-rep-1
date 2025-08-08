import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://baiuvyjptnggsuwucspy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaXV2eWpwdG5nZ3N1d3Vjc3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3ODczNjgsImV4cCI6MjA2OTM2MzM2OH0.0BjH7cO2uFmQrAVpeAYaHTFs-HK6jN9oickz_3Vq5KM';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface User {
  id: string;
  telegram_id?: string;
  username?: string; // Telegram username
  first_name?: string;
  last_name?: string;
  kyc_status?: boolean;
  bank_details_status?: boolean;
  bank_full_name?: string;
  bank_iban?: string;
  bank_swift_bic?: string;
  bank_name?: string;
  bank_country?: string;
  kyc_verification_url?: string;
  kyc_requested_at?: string;
  kyc_verified?: boolean;
  sumsub_external_user_id?: string;
  monthly_limit?: number;
  daily_limit?: number;
  monthly_limit_used?: number;
  daily_limit_used?: number;
  limit_reset_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  user_id?: string;
  telegram_id?: string;
  usdc_amount: number;
  eur_amount: number;
  direction: 'usdc-eur' | 'eur-usdc';
  exchange_rate: string;
  fee_percentage: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export async function checkUserExists(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user doesn't exist yet
        return null;
      }
      throw error;
    }

    return data as User;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return null;
  }
}

export async function updateUserKYCStatus(telegramId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        kyc_status: true,
        updated_at: new Date().toISOString()
      })
      .eq('telegram_id', telegramId)
      .select()
      .single();

    if (error) {
      console.error('Error updating KYC status for telegram_id:', telegramId, error);
      throw error;
    }

    console.log('Successfully updated KYC status for telegram_id:', telegramId);
    return data as User;
  } catch (error) {
    console.error('Error updating KYC status for telegram_id:', telegramId, error);
    return null;
  }
}

export async function updateUserBankDetailsStatus(telegramId: string, bankDetails: {
  fullName: string;
  iban: string;
  swiftBic?: string;
  bankName?: string;
  country: string;
}): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        bank_details_status: true,
        bank_full_name: bankDetails.fullName,
        bank_iban: bankDetails.iban,
        bank_swift_bic: bankDetails.swiftBic,
        bank_name: bankDetails.bankName,
        bank_country: bankDetails.country,
        updated_at: new Date().toISOString()
      })
      .eq('telegram_id', telegramId)
      .select()
      .single();

    if (error) {
      console.error('Error updating bank details status for telegram_id:', telegramId, error);
      throw error;
    }

    console.log('Successfully updated bank details status for telegram_id:', telegramId);
    return data as User;
  } catch (error) {
    console.error('Error updating bank details status for telegram_id:', telegramId, error);
    return null;
  }
}

export async function createOrder(orderData: {
  usdc_amount: number;
  eur_amount: number;
  direction: 'usdc-eur' | 'eur-usdc';
  exchange_rate: string;
  telegram_id?: string;
  user_id?: string;
}): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        usdc_amount: orderData.usdc_amount,
        eur_amount: orderData.eur_amount,
        direction: orderData.direction,
        exchange_rate: orderData.exchange_rate,
        telegram_id: orderData.telegram_id,
        user_id: orderData.user_id,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      throw error;
    }

    console.log('Successfully created order:', data.id);
    return data as Order;
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
}

export async function getUserOrders(userId?: string, telegramId?: string): Promise<Order[]> {
  try {
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by user_id or telegram_id if provided
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (telegramId) {
      query = query.eq('telegram_id', telegramId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }

    return (data as Order[]) || [];
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - order doesn't exist
        return null;
      }
      throw error;
    }

    return data as Order;
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    return null;
  }
}