import AsyncStorage from '@react-native-async-storage/async-storage';
import { User as SupabaseUser } from '@/lib/supabase';

// Re-export User type for convenience
export type User = SupabaseUser;

const USER_STORAGE_KEY = 'authenticated_user';
const AUTH_STATUS_KEY = 'is_authenticated';

export async function saveUserData(user: SupabaseUser): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    await AsyncStorage.setItem(AUTH_STATUS_KEY, 'true');
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
    await AsyncStorage.setItem(AUTH_STATUS_KEY, 'false');
    console.log('User data cleared from storage');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
}

export async function getAuthStatus(): Promise<boolean> {
  try {
    const authStatus = await AsyncStorage.getItem(AUTH_STATUS_KEY);
    return authStatus === 'true';
  } catch (error) {
    console.error('Error loading auth status:', error);
    return false;
  }
}

export async function setAuthStatus(isAuthenticated: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTH_STATUS_KEY, isAuthenticated ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting auth status:', error);
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