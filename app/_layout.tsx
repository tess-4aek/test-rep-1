import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initializeLanguage } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';

export default function RootLayout() {
  useFrameworkReady();
  const [isLanguageReady, setIsLanguageReady] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize language first
        await initializeLanguage();
        setIsLanguageReady(true);
      } catch (error) {
        console.error('❌ Error during app initialization:', error);
        setIsLanguageReady(true);
      }
    };
    
    initializeApp();
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLanguageReady && !isLoading) {
      if (isAuthenticated) {
        console.log('User is authenticated, navigating to home');
        router.replace('/(tabs)');
      } else {
        console.log('User is not authenticated, navigating to intro');
        router.replace('/');
      }
    }
  }, [isLanguageReady, isLoading, isAuthenticated]);

  // Show loading screen until language and auth check are complete
  if (!isLanguageReady || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3D8BFF" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F9',
  },
});
