import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initializeLanguage } from '@/lib/i18n';
import { getAuthStatus } from '@/utils/auth';

export default function RootLayout() {
  useFrameworkReady();
  const [isLanguageReady, setIsLanguageReady] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize language first
        await initializeLanguage();
        setIsLanguageReady(true);
        
        // Check authentication status
        const isAuthenticated = await getAuthStatus();
        console.log('Auth status on app start:', isAuthenticated);
        
        setIsAuthChecked(true);
        
        // Navigate based on auth status
        if (isAuthenticated) {
          console.log('User is authenticated, navigating to main app');
          router.replace('/(tabs)');
        } else {
          console.log('User is not authenticated, showing intro page');
          router.replace('/');
        }
      } catch (error) {
        console.error('❌ Error during app initialization:', error);
        setIsLanguageReady(true);
        setIsAuthChecked(true);
        // On error, show intro page
        router.replace('/');
      }
    };
    
    initializeApp();
  }, []);

  // Show loading screen until language and auth check are complete
  if (!isLanguageReady || !isAuthChecked) {
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
