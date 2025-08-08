import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, X } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { t } from '@/lib/i18n';
import { updateUserKYCStatus } from '@/lib/supabase';
import { getUserData, saveUserData } from '@/utils/auth';

export default function KYCWebViewPage() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleClose = () => {
    handleKYCCompletion();
  };

  const handleKYCCompletion = async () => {
    try {
      // Get current user data
      const currentUser = await getUserData();
      if (!currentUser) {
        console.error('No user data found');
        router.push('/');
        return;
      }

      if (!currentUser.telegram_id) {
        console.error('No telegram_id found for user');
        router.push('/post-kyc');
        return;
      }

      console.log('Updating KYC status for telegram_id:', currentUser.telegram_id);
      
      // Update KYC status in Supabase
      const updatedUser = await updateUserKYCStatus(currentUser.telegram_id);
      if (!updatedUser) {
        console.error('Failed to update KYC status');
        // Still navigate but show error
        router.push('/post-kyc');
        return;
      }

      // Update local user data
      await saveUserData(updatedUser);
      console.log('KYC status updated successfully');

      // Navigate to post-KYC page
      router.push('/post-kyc');
      
    } catch (error) {
      console.error('Error completing KYC:', error);
      // Still navigate on error to avoid blocking user
      router.push('/post-kyc');
    }
  };

  const handleLoadStart = () => {
    console.log('🌐 WebView started loading KYC verification page');
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    console.log('✅ WebView finished loading KYC verification page');
    setLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ WebView error:', nativeEvent);
    setLoading(false);
    setError(true);
  };

  const handleNavigationStateChange = (navState: any) => {
    console.log('🔄 WebView navigation:', navState.url);
    
    // Check if KYC process is completed based on URL patterns
    if (navState.url.includes('success') || navState.url.includes('completed')) {
      console.log('🎉 KYC verification appears to be completed');
      // Auto-complete KYC when success URL is detected
      handleKYCCompletion();
    }
  };

  if (!url) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('noUrlProvided')}</Text>
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
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <ArrowLeft color="#0C1E3C" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('kycVerificationTitle')}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
          <X color="#0C1E3C" size={24} />
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3D8BFF" />
          <Text style={styles.loadingText}>{t('loadingVerification')}</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('failedToLoad')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => setError(false)}>
            <Text style={styles.retryButtonText}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView */}
      {!error && (
        <WebView
          source={{ uri: url }}
          style={styles.webview}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState={true}
          scalesPageToFit={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsBackForwardNavigationGestures={true}
        />
      )}

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          {t('completeVerification')}
        </Text>
        <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
          <Text style={styles.doneButtonText}>{t('done')}</Text>
        </TouchableOpacity>
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
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F4F6F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1E3C',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F9',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#3D8BFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  instructionsContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  doneButton: {
    backgroundColor: '#3D8BFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#3D8BFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});