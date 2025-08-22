import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { AuthUser, initializeAuth, getCurrentUser } from '@/utils/auth';

interface AuthState {
  session: Session | null;
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clear: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: true,
  isInitialized: false,

  setSession: (session) => set({ session }),
  
  setUser: (user) => set({ user }),
  
  setLoading: (isLoading) => set({ isLoading }),

  initialize: async () => {
    try {
      set({ isLoading: true });
      const session = await initializeAuth();
      
      if (session) {
        const user = await getCurrentUser();
        set({ session, user, isLoading: false, isInitialized: true });
      } else {
        set({ session: null, user: null, isLoading: false, isInitialized: true });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ session: null, user: null, isLoading: false, isInitialized: true });
    }
  },

  refreshUser: async () => {
    try {
      const user = await getCurrentUser();
      set({ user });
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  },

  clear: () => {
    set({ session: null, user: null, isLoading: false });
  },
}));