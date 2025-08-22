import { supabase } from './supabase';
import * as SecureStore from 'expo-secure-store';
import { Session, User, AuthError } from '@supabase/supabase-js';

const SESSION_KEY = 'supabase_session';

export interface AuthUser {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  kyc_status?: boolean;
  bank_details_status?: boolean;
  bank_full_name?: string;
  bank_iban?: string;
  bank_swift_bic?: string;
  bank_name?: string;
  bank_country?: string;
  monthly_limit?: number;
  daily_limit?: number;
  monthly_limit_used?: number;
  daily_limit_used?: number;
  limit_reset_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: AuthUser;
  needsEmailVerification?: boolean;
}

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8 && /\d/.test(password);
};

// Map Supabase errors to user-friendly messages
const mapAuthError = (error: AuthError): string => {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password';
    case 'Email not confirmed':
      return 'Please verify your email address';
    case 'User already registered':
      return 'An account with this email already exists';
    case 'Password should be at least 6 characters':
      return 'Password must be at least 8 characters with at least 1 digit';
    default:
      return error.message || 'An unexpected error occurred';
  }
};

// Store session securely
const storeSession = async (session: Session | null): Promise<void> => {
  try {
    if (session) {
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    } else {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
  } catch (error) {
    console.error('Error storing session:', error);
  }
};

// Get stored session
const getStoredSession = async (): Promise<Session | null> => {
  try {
    const sessionData = await SecureStore.getItemAsync(SESSION_KEY);
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('Error getting stored session:', error);
    return null;
  }
};

// Sign up with email and password
export const signUp = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    if (!isValidEmail(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    if (!isValidPassword(password)) {
      return { success: false, error: 'Password must be at least 8 characters with at least 1 digit' };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { success: false, error: mapAuthError(error) };
    }

    if (data.session) {
      await storeSession(data.session);
      const user = await getCurrentUser();
      return { success: true, user };
    }

    // Email confirmation required
    return { 
      success: true, 
      needsEmailVerification: true 
    };
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    if (!isValidEmail(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: mapAuthError(error) };
    }

    if (data.session) {
      await storeSession(data.session);
      const user = await getCurrentUser();
      return { success: true, user };
    }

    return { success: false, error: 'Failed to sign in' };
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
    await storeSession(null);
  } catch (error) {
    console.error('Error signing out:', error);
    // Clear session even if signOut fails
    await storeSession(null);
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<AuthResponse> => {
  try {
    if (!isValidEmail(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return { success: false, error: mapAuthError(error) };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Update password (for reset password flow)
export const updatePassword = async (newPassword: string): Promise<AuthResponse> => {
  try {
    if (!isValidPassword(newPassword)) {
      return { success: false, error: 'Password must be at least 8 characters with at least 1 digit' };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: mapAuthError(error) };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Get current session
export const getSession = async (): Promise<Session | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await storeSession(session);
      return session;
    }
    
    // Try to get from secure store if Supabase doesn't have it
    return await getStoredSession();
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

// Get current user with profile data
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const session = await getSession();
    if (!session?.user) {
      return null;
    }

    // Get user profile from database
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user profile:', error);
    }

    return {
      id: session.user.id,
      email: session.user.email,
      ...profile,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Initialize session on app start
export const initializeAuth = async (): Promise<Session | null> => {
  try {
    // First try to get session from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      await storeSession(session);
      return session;
    }

    // If no session from Supabase, try stored session
    const storedSession = await getStoredSession();
    if (storedSession) {
      // Validate stored session by setting it
      const { error } = await supabase.auth.setSession(storedSession);
      if (!error) {
        return storedSession;
      } else {
        // Invalid stored session, clear it
        await storeSession(null);
      }
    }

    return null;
  } catch (error) {
    console.error('Error initializing auth:', error);
    return null;
  }
};

// Helper for authenticated fetch requests
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const session = await getSession();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

// Determine next screen based on user status
export const determineNextScreen = (user: AuthUser): string => {
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
};