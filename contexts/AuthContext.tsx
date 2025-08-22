import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  user: User | null;
  userId: string | null;
  email: string | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'supabase_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Persist session to secure storage
  const persistSession = async (session: Session | null) => {
    try {
      if (session) {
        await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
      } else {
        await SecureStore.deleteItemAsync(SESSION_KEY);
      }
    } catch (error) {
      console.error('Error persisting session:', error);
    }
  };

  // Load session from secure storage
  const loadPersistedSession = async () => {
    try {
      const sessionData = await SecureStore.getItemAsync(SESSION_KEY);
      if (sessionData) {
        const parsedSession = JSON.parse(sessionData);
        // Validate session is still valid
        const { data: { session: validSession }, error } = await supabase.auth.setSession({
          access_token: parsedSession.access_token,
          refresh_token: parsedSession.refresh_token,
        });
        
        if (error) {
          console.error('Error restoring session:', error);
          await SecureStore.deleteItemAsync(SESSION_KEY);
          return null;
        }
        
        return validSession;
      }
    } catch (error) {
      console.error('Error loading persisted session:', error);
    }
    return null;
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // First try to get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          if (mounted) {
            setSession(currentSession);
            setUser(currentSession.user);
            await persistSession(currentSession);
          }
        } else {
          // Try to restore from secure storage
          const persistedSession = await loadPersistedSession();
          if (persistedSession && mounted) {
            setSession(persistedSession);
            setUser(persistedSession.user);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          await persistSession(session);
          
          if (event === 'SIGNED_OUT') {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (!error) {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
    
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'myapp://reset-password',
    });
    
    return { error };
  };

  const value: AuthContextType = {
    user,
    userId: user?.id ?? null,
    email: user?.email ?? null,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}