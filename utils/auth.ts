import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/lib/supabase';

const USER_STORAGE_KEY = 'authenticated_user';

export async function saveUserData(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    console.log('User data saved to storage');
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

export async function getUserData(): Promise<User | null> {
  try {
    const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (userData) {
      return JSON.parse(userData) as User;
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

export function determineNextScreen(user: User): string {
  // Check KYC status first
  if (!user.kyc_status) {
    return '/auth-progress';
  }
  
  // Then check bank details status
  if (!user.bank_details_status) {
    return '/bank-details';
  }
  
  // If both are complete, go to main app
  return '/(tabs)';
}