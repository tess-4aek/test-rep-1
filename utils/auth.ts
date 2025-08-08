import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { User as SupabaseUser } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

// Re-export User type for convenience
export type User = SupabaseUser;

const USER_STORAGE_KEY = 'authenticated_user';
const USER_UUID_KEY = 'userUUID';

/**
 * Save user UUID to secure storage
 */
export async function saveUserUUID(uuid: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_UUID_KEY, uuid);
    console.log('User UUID saved to secure storage');
  } catch (error) {
    console.error('Error saving user UUID:', error);
  }
}

/**
 * Get user UUID from secure storage
 */
export async function getUserUUID(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(USER_UUID_KEY);
  } catch (error) {
    console.error('Error loading user UUID:', error);
    return null;
  }
}

/**
 * Clear user UUID from secure storage
 */
export async function clearUserUUID(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(USER_UUID_KEY);
    console.log('User UUID cleared from secure storage');
  } catch (error) {
    console.error('Error clearing user UUID:', error);
  }
}
export async function saveUserData(user: SupabaseUser): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    // Also set authentication flag when saving user data
    const { login } = useAuth();
    await login();
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
    // Also clear authentication flag when clearing user data
    const { logout } = useAuth();
    await logout();
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