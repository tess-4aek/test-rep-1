import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://baiuvyjptnggsuwucspy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaXV2eWpwdG5nZ3N1d3Vjc3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3ODczNjgsImV4cCI6MjA2OTM2MzM2OH0.0BjH7cO2uFmQrAVpeAYaHTFs-HK6jN9oickz_3Vq5KM';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface User {
  id: string;
  name?: string;
  telegram_username?: string;
  kyc_status?: boolean;
  bank_details_status?: boolean;
  created_at?: string;
  updated_at?: string;
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