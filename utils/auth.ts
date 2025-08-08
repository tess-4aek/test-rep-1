import AsyncStorage from '@react-native-async-storage/async-storage';
import { User as SupabaseUser } from '@/lib/supabase';

// Re-export User type for convenience
export type User = SupabaseUser;

const USER_STORAGE_KEY = 'authenticated_user';

export async function saveUserData(user: SupabaseUser): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    console.log('User data saved to storage');
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

export async function getUserData(): Promise<SupabaseUser | null> {
  try {
    const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (userData) {
      return JSON.parse(userData) as SupabaseUser;
    }
    return null;
  } catch (error) {
    console.error('Error loading user data:', error);
    return null;
  }
}

export async function clearUserData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    console.log('User data cleared from storage');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
}

export function determineNextScreen(user: SupabaseUser): string {
  // Check KYC status first
  if (!user.kyc_status || user.kyc_status === false) {
    return '/auth-progress';
  }
  
  // Then check bank details status
  if (!user.bank_details_status || user.bank_details_status === false) {
    return '/bank-details';
  }
  
  // If both are complete, go to main app
  return '/(tabs)';
}