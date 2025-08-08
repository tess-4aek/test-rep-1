import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initializeLanguage } from '@/lib/i18n';
import { router } from 'expo-router';
import { getUserData, clearUserData, saveUserData, determineNextScreen } from '@/utils/auth';
import { checkUserExists } from '@/lib/supabase';

export default function RootLayout() {
  useFrameworkReady();
  const [isLanguageReady, setIsLanguageReady] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      // Initialize language first
      await initializeLanguage();
      setIsLanguageReady(true);
      
      // Then check authentication
      await checkAuthentication();
      setIsAuthChecked(true);
    };
    
    initializeApp();
  }, []);

  const checkAuthentication = async () => {
    try {
      console.log('🔍 Checking user authentication...');
      
      // Get locally stored user data
      const localUser = await getUserData();
      
      if (!localUser || !localUser.id) {
        console.log('❌ No local user data found, redirecting to auth');
        await clearUserData();
        router.replace('/');
        return;
      }
      
      console.log('📱 Local user found:', localUser.id);
      
      // Check if user exists in database
      const dbUser = await checkUserExists(localUser.id);
      
      if (!dbUser) {
        console.log('❌ User not found in database, clearing local data');
        await clearUserData();
        router.replace('/');
        return;
      }
      
      console.log('✅ User verified in database');
      
      // Update local data with latest from database
      await saveUserData(dbUser);
      
      // Determine where to redirect based on user status
      const nextScreen = determineNextScreen(dbUser);
      console.log('🚀 Redirecting to:', nextScreen);
      
      router.replace(nextScreen);
      
    } catch (error) {
      console.error('💥 Error during authentication check:', error);
      // On error, clear local data and redirect to auth
      await clearUserData();
      router.replace('/');
    }
  };
  // Show loading screen until language and auth are ready
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
