import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { X } from 'lucide-react-native';

interface AuthWebViewProps {
  visible: boolean;
  provider: 'google' | 'apple';
  onClose: () => void;
}

export default function AuthWebView({ visible, provider, onClose }: AuthWebViewProps) {
  const [loading, setLoading] = React.useState(true);

  const getAuthUrl = () => {
    // In a real implementation, you would get the OAuth URL from Supabase
    // For now, we'll use placeholder URLs
    const baseUrl = 'https://your-project.supabase.co/auth/v1/authorize';
    const params = new URLSearchParams({
      provider: provider,
      redirect_to: 'myapp://auth/callback'
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const handleNavigationStateChange = (navState: any) => {
    // Check if we've been redirected back to our app
    if (navState.url.includes('myapp://auth/callback')) {
      // Handle the callback - extract tokens, etc.
      console.log('OAuth callback received:', navState.url);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar style="dark" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Sign in with {provider === 'google' ? 'Google' : 'Apple'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color="#6B7280" size={24} />
          </TouchableOpacity>
        </View>

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3D8BFF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {/* WebView */}
        <WebView
          source={{ uri: getAuthUrl() }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState={true}
          scalesPageToFit={true}
        />
      </View>
    </Modal>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1E3C',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F6F9',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});