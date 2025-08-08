import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { getAuthStatus, getUserData, determineNextScreen } from '@/utils/auth';

export default function AuthGate() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRoute = async () => {
      try {
        console.log('🔍 Checking authentication status...');
        
        // Check if user is authenticated
        const isAuthenticated = await getAuthStatus();
        console.log('Auth status:', isAuthenticated);
        
        if (isAuthenticated) {
          // User is authenticated, get user data to determine next screen
          const userData = await getUserData();
          
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
          console.log('🚪 User not authenticated, navigating to intro');
          router.replace('/index');
        }
      } catch (error) {
        console.error('❌ Error during auth check:', error);
        // On error, default to intro screen
        router.replace('/index');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndRoute();
      router.replace('/index');
  }
  )

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