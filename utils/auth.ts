import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/supabase';

// Storage keys
const USER_DATA_KEY = 'user_data';
const USER_UUID_KEY = 'user_uuid';

// Get user data from storage
export async function getUserData(): Promise<User | null> {
  try {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    if (userData) {
      return JSON.parse(userData) as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

// Save user data to storage
export async function saveUserData(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    console.log('User data saved successfully');
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
}

// Clear user data from storage
export async function clearUserData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(USER_DATA_KEY);
    console.log('User data cleared successfully');
  } catch (error) {
    console.error('Error clearing user data:', error);
    throw error;
  }
}

// Get user UUID from storage
export async function getUserUUID(): Promise<string | null> {
  try {
    const uuid = await AsyncStorage.getItem(USER_UUID_KEY);
    return uuid;
  } catch (error) {
    console.error('Error getting user UUID:', error);
    return null;
  }
}

// Save user UUID to storage
export async function saveUserUUID(uuid: string): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_UUID_KEY, uuid);
    console.log('User UUID saved successfully');
  } catch (error) {
    console.error('Error saving user UUID:', error);
    throw error;
  }
}

// Clear user UUID from storage
export async function clearUserUUID(): Promise<void> {
  try {
    await AsyncStorage.removeItem(USER_UUID_KEY);
    console.log('User UUID cleared successfully');
  } catch (error) {
    console.error('Error clearing user UUID:', error);
    throw error;
  }
}

// Check if user is authenticated
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    // Check Supabase session first
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return true;
    }

    // Fallback to local storage
    const userData = await getUserData();
    return userData !== null;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

// Sign out user
export async function signOut(): Promise<void> {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear local storage
    await clearUserData();
    await clearUserUUID();
    
    console.log('✅ User signed out successfully');
  } catch (error) {
    console.error('❌ Error signing out:', error);
    throw error;
  }
}

// Export User type for convenience
export type { User };