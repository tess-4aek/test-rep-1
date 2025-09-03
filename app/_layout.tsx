import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initializeLanguage } from '@/lib/i18n';
import AppPreloader from '@/components/AppPreloader';

export default function RootLayout() {
  useFrameworkReady();
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setProgress(20);
        
        // Initialize language
        await initializeLanguage();
        setProgress(60);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 300));
        setProgress(100);
        
        // Mark as ready
        setIsReady(true);
      } catch (error) {
        console.error('❌ Error during app initialization:', error);
        // Still mark as ready even on error
        setIsReady(true);
      }
    };
    
    initializeApp();
  }, []);

  // Show preloader while initializing
  if (!isReady) {
    return (
      <AppPreloader 
        progress={progress} 
        message={
          progress < 40 ? 'Initializing app...' :
          progress < 80 ? 'Loading language settings...' :
          'Almost ready...'
        }
      />
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="ramp" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="order-confirmation" options={{ headerShown: false }} />
        <Stack.Screen name="order-details" options={{ headerShown: false }} />
        <Stack.Screen name="limit-details" options={{ headerShown: false }} />
        <Stack.Screen name="transaction-history" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="help-support" options={{ headerShown: false }} />
        <Stack.Screen name="personal-information" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}