import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/store/useAuth';
import { determineNextScreen } from '@/utils/auth';

export default function AuthGuard() {
  const { session, user, isLoading, isInitialized, initialize } = useAuth();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  useEffect(() => {
    if (isInitialized && !isLoading) {
      if (session && user) {
        // User is authenticated, determine next screen
        const nextScreen = determineNextScreen(user);
        console.log('🏠 User authenticated, navigating to:', nextScreen);
        router.replace(nextScreen as any);
      } else {
        // User not authenticated, go to sign in
        console.log('🚪 User not authenticated, navigating to sign-in screen');
        router.replace('/sign-in');
      }
    }
  }, [session, user, isLoading, isInitialized]);

  // Show loading screen while checking auth
  if (!isInitialized || isLoading) {
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