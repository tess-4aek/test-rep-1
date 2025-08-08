import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initializeLanguage } from '@/lib/i18n';
import { verifyUserAuthentication } from '@/utils/auth';

export default function RootLayout() {
  useFrameworkReady();
  const [isLanguageReady, setIsLanguageReady] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing app...');
        
        // Initialize language first
        await initializeLanguage();
        setIsLanguageReady(true);
        console.log('🌐 Language initialized');
        
        // Then verify authentication
        const authResult = await verifyUserAuthentication();
        console.log('🔐 Authentication check result:', authResult);
        
        setIsAuthChecked(true);
        
        // Navigate to appropriate screen
        if (authResult.isAuthenticated) {
          console.log('✅ User authenticated, navigating to:', authResult.nextScreen);
          router.replace(authResult.nextScreen);
        } else {
          console.log('❌ User not authenticated, navigating to intro');
          router.replace('/');
        }
        
      } catch (error) {
        console.error('💥 App initialization error:', error);
        // On error, clear auth and go to intro
        router.replace('/');
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeApp();
  }, []);

  // Show loading screen until app is fully initialized
  if (!isLanguageReady || !isAuthChecked || isInitializing) {
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
