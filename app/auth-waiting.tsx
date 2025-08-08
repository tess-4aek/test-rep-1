import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, MessageCircle } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { checkUserExists, User } from '@/lib/supabase';
import { saveUserData, determineNextScreen } from '@/utils/auth';
import { t } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';

export default function AuthWaitingPage() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const pollCount = useRef(0);
  const maxPolls = 60; // 5 minutes maximum (60 * 5 seconds)
  const { login } = useAuth();

  const handleBack = () => {
    // Stop polling when going back
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
    router.back();
  };

  const startPolling = async () => {
    if (!uuid) {
      setError(t('noAuthSession'));
      setIsPolling(false);
      return;
    }

    console.log('Starting polling for user with UUID:', uuid);
    
    // Initial check
    await checkForUser();
    
    // Set up polling interval
    pollingInterval.current = setInterval(async () => {
      pollCount.current += 1;
      console.log(`Polling attempt ${pollCount.current}/${maxPolls}`);
      
      if (pollCount.current >= maxPolls) {
        console.log('Max polling attempts reached');
        setError(t('authTimeout'));
        setIsPolling(false);
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
        }
        return;
      }
      
      await checkForUser();
    }, 5000); // Poll every 5 seconds
  };

  const checkForUser = async () => {
    try {
      console.log('Checking for user with UUID:', uuid);
      const user = await checkUserExists(uuid!);
      
      if (user) {
        console.log('User found:', user);
        
        // Stop polling
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
        }
        setIsPolling(false);
        
        // Save user data locally
        await saveUserData(user);
        
        // Set authentication state
        await login();
        
        // Determine next screen based on user status
        const nextScreen = determineNextScreen(user);
        console.log('Navigating to:', nextScreen);
        
        // Navigate to appropriate screen
        router.replace(nextScreen);
      } else {
        console.log('User not found yet, continuing to poll...');
      }
    } catch (error) {
      console.error('Error checking for user:', error);
      setError(t('authError'));
      setIsPolling(false);
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    }
  };

  useEffect(() => {
    startPolling();
    
    // Cleanup on unmount
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [uuid]);

  const handleRetry = () => {
    setError(null);
    setIsPolling(true);
    pollCount.current = 0;
    startPolling();
  };

  if (!uuid) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('noAuthSession')}</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>{t('goBack')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBackButton}>
          <ArrowLeft color="#0C1E3C" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('telegramAuth')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>{t('retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <View style={styles.iconContainer}>
              <MessageCircle color="#3D8BFF" size={48} />
            </View>
            
            <ActivityIndicator size="large" color="#3D8BFF" style={styles.spinner} />
            
            <Text style={styles.waitingText}>{t('waitingForTelegram')}</Text>
            <Text style={styles.instructionText}>
              {t('telegramInstructions')}
            </Text>
            
            <View style={styles.pollingInfo}>
              <Text style={styles.pollingText}>
                {t('checkingStatus')} ({pollCount.current + 1}/{maxPolls})
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#F4F6F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1E3C',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingContainer: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#3D8BFF' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  spinner: {
    marginBottom: 24,
  },
  waitingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0C1E3C',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 28,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  pollingInfo: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pollingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    maxWidth: 320,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: '#3D8BFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});