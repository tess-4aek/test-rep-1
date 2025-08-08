import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initializeLanguage } from '@/lib/i18n';
import { checkUserAuthentication, hasAuthCheckBeenPerformed } from '@/lib/auth-check';

export default function RootLayout() {
  useFrameworkReady();
  const [isLanguageReady, setIsLanguageReady] = useState(false);
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize language first
        await initializeLanguage();
        setIsLanguageReady(true);
        
        // Check if auth check has already been performed
        const authCheckPerformed = await hasAuthCheckBeenPerformed();
        
        if (!authCheckPerformed) {
          console.log('🔐 Performing initial authentication check...');
          await checkUserAuthentication();
        } else {
          console.log('✅ Authentication check already performed, skipping...');
        }
        
        setIsAuthCheckComplete(true);
      } catch (error) {
        console.error('❌ Error during app initialization:', error);
        setIsLanguageReady(true);
        setIsAuthCheckComplete(true);
      }
    };
    
    initializeApp();
  }, []);

  // Show loading screen until language and auth check are complete
  if (!isLanguageReady || !isAuthCheckComplete) {
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
