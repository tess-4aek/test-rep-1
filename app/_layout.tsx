import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initializeLanguage } from '@/lib/i18n';
import AuthGuard from '@/components/AuthGuard';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/store/useAuth';

export default function RootLayout() {
  useFrameworkReady();
  const { setSession, setUser, clear } = useAuth();

  useEffect(() => {
    // Initialize language
    initializeLanguage().catch(console.error);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session) {
          setSession(session);
          // User data will be fetched by the auth store
        } else {
          clear();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}