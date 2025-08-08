import AsyncStorage from '@react-native-async-storage/async-storage';
import { User as SupabaseUser, checkUserExists } from '@/lib/supabase';

// Re-export User type for convenience
export type User = SupabaseUser;

const USER_STORAGE_KEY = 'authenticated_user';
const AUTH_STATUS_KEY = 'is_authorized';

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

export async function setAuthStatus(isAuthorized: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTH_STATUS_KEY, isAuthorized ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting auth status:', error);
  }
}

export async function verifyUserAuthentication(): Promise<{
  isAuthenticated: boolean;
  user: SupabaseUser | null;
  nextScreen: string;
}> {
  try {
    console.log('🔍 Starting authentication verification...');
    
    // Get local user data
    const localUser = await getUserData();
    if (!localUser || !localUser.id) {
      console.log('❌ No local user data found');
      await clearUserData();
      return {
        isAuthenticated: false,
        user: null,
        nextScreen: '/',
      };
    }

    console.log('📱 Local user found:', localUser.id);

    // Check if user exists in database
    const dbUser = await checkUserExists(localUser.id);
    if (!dbUser) {
      console.log('❌ User not found in database, clearing local data');
      await clearUserData();
      return {
        isAuthenticated: false,
        user: null,
        nextScreen: '/',
      };
    }

    console.log('✅ User verified in database');
    
    // Update local data with latest from database
    await saveUserData(dbUser);
    
    // Determine next screen based on user status
    const nextScreen = determineNextScreen(dbUser);
    
    return {
      isAuthenticated: true,
      user: dbUser,
      nextScreen,
    };
    
  } catch (error) {
    console.error('💥 Error during authentication verification:', error);
    await clearUserData();
    return {
      isAuthenticated: false,
      user: null,
      nextScreen: '/',
    };
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