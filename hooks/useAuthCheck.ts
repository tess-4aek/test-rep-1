import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { checkUserExists } from '@/lib/supabase';
import { getUserData, saveUserData, clearUserData, setAuthStatus, determineNextScreen } from '@/utils/auth';

export function useAuthCheck() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      console.log('🔍 Starting authentication check...');
      
      // Get local user data
      const localUser = await getUserData();
      
      if (!localUser || !localUser.id) {
        console.log('❌ No local user data found');
        await handleUnauthenticated();
        return;
      }

      console.log('📱 Local user ID found:', localUser.id);
      
      // Check if user exists in database
      const dbUser = await checkUserExists(localUser.id);
      
      if (!dbUser) {
        console.log('❌ User not found in database, clearing local data');
        await handleUnauthenticated();
        return;
      }

      console.log('✅ User found in database, updating local data');
      
      // Update local storage with fresh data from database
      await saveUserData(dbUser);
      await setAuthStatus(true);
      setIsAuthenticated(true);
      
      // Navigate to appropriate screen based on user status
      const nextScreen = determineNextScreen(dbUser);
      console.log('🚀 Navigating to:', nextScreen);
      
      if (nextScreen === '/(tabs)') {
        router.replace('/(tabs)');
      } else {
        router.replace(nextScreen);
      }
      
    } catch (error) {
      console.error('💥 Error during authentication check:', error);
      await handleUnauthenticated();
    } finally {
      setIsChecking(false);
    }
  };

  const handleUnauthenticated = async () => {
    try {
      // Clear all user data but keep auth status as false
      await clearUserData();
      await setAuthStatus(false);
      setIsAuthenticated(false);
      
      // Navigate to intro/auth page
      router.replace('/');
    } catch (error) {
      console.error('Error handling unauthenticated state:', error);
    }
  };

  return {
    isChecking,
    isAuthenticated,
  };
}