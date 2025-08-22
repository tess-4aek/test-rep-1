import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { getAuthStatus, getUserData, determineNextScreen, checkSupabaseAuth } from '@/utils/auth';
import { supabase } from '@/lib/supabase';

export default function AuthGate() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRoute = async () => {
      try {
        console.log('🔍 Checking authentication status...');
        
        // Check both local auth status and Supabase session
        const [isLocallyAuthenticated, isSupabaseAuthenticated] = await Promise.all([
          getAuthStatus(),
          checkSupabaseAuth()
        ]);
        
        console.log('Local auth status:', isLocallyAuthenticated);
        console.log('Supabase auth status:', isSupabaseAuthenticated);
        
        const isAuthenticated = isLocallyAuthenticated || isSupabaseAuthenticated;
        
        if (isAuthenticated) {
          let userData = await getUserData();
          
          // If no local user data but Supabase session exists, get from Supabase
          if (!userData && isSupabaseAuthenticated) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              userData = {
                id: session.user.id,
                email: session.user.email,
                created_at: session.user.created_at,
                updated_at: new Date().toISOString(),
              } as any;
            }
          }
          
          if (userData) {
            // Determine the appropriate screen based on user completion status
            const nextScreen = determineNextScreen(userData);
            console.log('🏠 User authenticated, navigating to:', nextScreen);
            router.replace(nextScreen as any);
          } else {
            // User marked as authenticated but no user data found
            console.log('⚠️ Auth status true but no user data, going to intro');
            router.replace('/');
          }
        } else {
          // User not authenticated, go to intro
          console.log('🚪 User not authenticated, navigating to sign-in screen');
          router.replace('/');
        }
      } catch (error) {
        console.error('❌ Error during auth check:', error);
        // On error, default to sign-in screen
        router.replace('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndRoute();
  }, []);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3D8BFF" />
      </View>
    );
  }

  // Return null after navigation
  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F9',
  },
});