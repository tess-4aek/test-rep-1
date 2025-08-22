import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { User as SupabaseUser, supabase } from '@/lib/supabase';

// Re-export User type for convenience
export type User = SupabaseUser;

const USER_STORAGE_KEY = 'authenticated_user';
const USER_UUID_KEY = 'userUUID';
const AUTH_STATUS_KEY = 'is_auth';

/**
 * Set authentication status
 */
export async function setAuthStatus(isAuthenticated: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTH_STATUS_KEY, isAuthenticated ? 'true' : 'false');
    console.log('Auth status set to:', isAuthenticated);
  } catch (error) {
    console.error('Error setting auth status:', error);
  }
}

/**
 * Get authentication status
 */
export async function getAuthStatus(): Promise<boolean> {
  try {
    const status = await AsyncStorage.getItem(AUTH_STATUS_KEY);
    return status === 'true';
  } catch (error) {
    console.error('Error getting auth status:', error);
    return false;
  }
}

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
    await setAuthStatus(true);
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
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    await setAuthStatus(false);
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

/**
 * Check if user is authenticated via Supabase
 */
export async function checkSupabaseAuth(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Error checking Supabase auth:', error);
    return false;
  }
}