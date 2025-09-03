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
        
        // FOR TESTING: Always set auth status to true
        const isAuthenticated = true;
        console.log('Auth status (TEST MODE):', isAuthenticated);
        
        if (isAuthenticated) {
          // User is authenticated, get user data to determine next screen
          const userData = await getUserData();
          
          if (userData) {
            // Determine the appropriate screen based on user completion status
            const nextScreen = determineNextScreen(userData);
            console.log('🏠 User authenticated, navigating to:', nextScreen);
            router.replace(nextScreen as any);
          } else {
            // FOR TESTING: Navigate to main app even without user data
            console.log('⚠️ Auth status true but no user data, going to main app for testing');
            router.replace('/(tabs)');
          }
        } else {
          // User not authenticated, go to intro
          console.log('🚪 User not authenticated, navigating to sign-in screen');
          router.replace('/');
        }
      } catch (error) {
        console.error('❌ Error during auth check:', error);
        // FOR TESTING: On error, go to main app
        router.replace('/(tabs)');
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