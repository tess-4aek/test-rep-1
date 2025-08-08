import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEY = 'is_auth';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
  });

  // Load authentication state on hook initialization
  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const authValue = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      const isAuthenticated = authValue === 'true';
      
      console.log('Loaded auth state:', isAuthenticated);
      
      setAuthState({
        isAuthenticated,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading auth state:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = async () => {
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, 'true');
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
      });
      console.log('User logged in, auth state set to true');
    } catch (error) {
      console.error('Error setting auth state to true:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, 'false');
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
      });
      console.log('User logged out, auth state set to false');
    } catch (error) {
      console.error('Error setting auth state to false:', error);
    }
  };

  return {
    ...authState,
    login,
    logout,
    refresh: loadAuthState,
  };
}