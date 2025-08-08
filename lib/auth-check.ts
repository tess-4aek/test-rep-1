import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import 'react-native-url-polyfill/auto';

// Storage keys
const USER_UUID_KEY = 'userUUID';
const IS_AUTHENTICATED_KEY = 'isAuthenticated';

// Types
interface VerifyUserResponse {
  success: boolean;
  uuid?: string;
  error?: string;
}

interface AuthCheckResult {
  isAuthenticated: boolean;
  error?: string;
}

/**
 * Safely get value from SecureStore with error handling
 */
async function getSecureValue(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Error reading from SecureStore (${key}):`, error);
    return null;
  }
}

/**
 * Safely set value in SecureStore with error handling
 */
async function setSecureValue(key: string, value: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(key, value);
    return true;
  } catch (error) {
    console.error(`Error writing to SecureStore (${key}):`, error);
    return false;
  }
}

/**
 * Safely delete value from SecureStore with error handling
 */
async function deleteSecureValue(key: string): Promise<boolean> {
  try {
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch (error) {
    console.error(`Error deleting from SecureStore (${key}):`, error);
    return false;
  }
}

/**
 * Clear all storage keys except isAuthenticated
 */
async function clearStorageExceptAuth(): Promise<void> {
  try {
    console.log('🧹 Clearing storage except authentication flag...');
    
    // Get all keys that might exist (add more as needed)
    const keysToCheck = [
      USER_UUID_KEY,
      'authenticated_user', // From existing auth utils
      'user_language_preference', // From i18n
    ];
    
    // Delete each key except isAuthenticated
    for (const key of keysToCheck) {
      if (key !== IS_AUTHENTICATED_KEY) {
        await deleteSecureValue(key);
      }
    }
    
    console.log('✅ Storage cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
  }
}

/**
 * Verify user UUID with backend
 */
async function verifyUserWithBackend(userUUID: string): Promise<VerifyUserResponse> {
  try {
    console.log('🔍 Verifying user UUID with backend:', userUUID);
    
    const response = await fetch('/api/user/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userUUID }),
    });

    if (!response.ok) {
      console.error('❌ Backend verification failed:', response.status, response.statusText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('📄 Backend verification response:', data);

    return {
      success: true,
      uuid: data.uuid || null,
    };
  } catch (error) {
    console.error('❌ Network error during user verification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Compare UUIDs (case-insensitive, handling null/undefined)
 */
function compareUUIDs(localUUID: string | null, backendUUID: string | null | undefined): boolean {
  if (!localUUID || !backendUUID) {
    return false;
  }
  
  return localUUID.toLowerCase() === backendUUID.toLowerCase();
}

/**
 * Main authentication check function
 * This function should only be called once on app startup
 */
export async function checkUserAuthentication(): Promise<AuthCheckResult> {
  try {
    console.log('🔐 Starting authentication check...');
    
    // Step 1: Retrieve userUUID from local storage
    const localUserUUID = await getSecureValue(USER_UUID_KEY);
    console.log('📱 Local userUUID:', localUserUUID ? 'Found' : 'Not found');
    
    if (!localUserUUID) {
      console.log('❌ No local userUUID found, user not authenticated');
      await setSecureValue(IS_AUTHENTICATED_KEY, 'false');
      router.replace('/');
      return { isAuthenticated: false };
    }

    // Step 2: Verify with backend
    const verificationResult = await verifyUserWithBackend(localUserUUID);
    
    if (!verificationResult.success) {
      console.log('❌ Backend verification failed:', verificationResult.error);
      await clearStorageExceptAuth();
      await setSecureValue(IS_AUTHENTICATED_KEY, 'false');
      router.replace('/');
      return { 
        isAuthenticated: false, 
        error: verificationResult.error 
      };
    }

    // Step 3: Compare UUIDs
    const uuidsMatch = compareUUIDs(localUserUUID, verificationResult.uuid);
    console.log('🔍 UUID comparison:', {
      local: localUserUUID,
      backend: verificationResult.uuid,
      match: uuidsMatch,
    });

    if (uuidsMatch) {
      // Step 4: UUIDs match - user is authenticated
      console.log('✅ User authentication successful');
      await setSecureValue(IS_AUTHENTICATED_KEY, 'true');
      router.replace('/(tabs)');
      return { isAuthenticated: true };
    } else {
      // Step 5: UUIDs don't match - clear storage and redirect to auth
      console.log('❌ UUID mismatch, clearing storage and redirecting to auth');
      await clearStorageExceptAuth();
      await setSecureValue(IS_AUTHENTICATED_KEY, 'false');
      router.replace('/');
      return { isAuthenticated: false };
    }
    
  } catch (error) {
    console.error('💥 Unexpected error during authentication check:', error);
    
    // On error, assume not authenticated and redirect to auth screen
    await setSecureValue(IS_AUTHENTICATED_KEY, 'false');
    router.replace('/');
    
    return { 
      isAuthenticated: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if authentication check has already been performed
 */
export async function hasAuthCheckBeenPerformed(): Promise<boolean> {
  try {
    const isAuthenticated = await getSecureValue(IS_AUTHENTICATED_KEY);
    return isAuthenticated !== null;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
}

/**
 * Get current authentication status
 */
export async function getAuthenticationStatus(): Promise<boolean> {
  try {
    const isAuthenticated = await getSecureValue(IS_AUTHENTICATED_KEY);
    return isAuthenticated === 'true';
  } catch (error) {
    console.error('Error getting auth status:', error);
    return false;
  }
}

/**
 * Set user as authenticated and save UUID
 */
export async function setUserAuthenticated(userUUID: string): Promise<boolean> {
  try {
    const uuidSaved = await setSecureValue(USER_UUID_KEY, userUUID);
    const authSaved = await setSecureValue(IS_AUTHENTICATED_KEY, 'true');
    
    return uuidSaved && authSaved;
  } catch (error) {
    console.error('Error setting user as authenticated:', error);
    return false;
  }
}

/**
 * Clear authentication and redirect to auth screen
 */
export async function clearAuthentication(): Promise<void> {
  try {
    console.log('🚪 Clearing authentication...');
    await clearStorageExceptAuth();
    await setSecureValue(IS_AUTHENTICATED_KEY, 'false');
    router.replace('/');
  } catch (error) {
    console.error('Error clearing authentication:', error);
  }
}