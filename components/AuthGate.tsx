import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useSegments } from 'expo-router';
import { isUserAuthenticated } from '@/utils/auth';

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const segments = useSegments();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await isUserAuthenticated();
      setIsAuthenticated(authenticated);
      
      // Navigate based on auth status
      if (!authenticated && !segments.includes('auth')) {
        router.replace('/auth');
      } else if (authenticated && segments.includes('auth')) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // On error, assume not authenticated
      setIsAuthenticated(false);
      if (!segments.includes('auth')) {
        router.replace('/auth');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3D8BFF" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F9',
  },
});