import React, { useRef } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { X } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

interface AuthWebViewProps {
  visible: boolean;
  provider: 'google' | 'apple';
  onClose: () => void;
}

export default function AuthWebView({ visible, provider, onClose }: AuthWebViewProps) {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.ok && data.token) {
        // Store JWT in SecureStore
        await SecureStore.setItemAsync('auth_token', data.token);
        
        // Store user data if provided
        if (data.user) {
          await SecureStore.setItemAsync('auth_user', JSON.stringify(data.user));
        }
        
        // Close WebView
        onClose();
        
        // Navigate to main app
        router.replace('/(tabs)/history');
      } else if (data.error) {
        // Show error and close
        Alert.alert('Authentication Error', data.error);
        onClose();
      }
    } catch (error) {
      console.error('Failed to parse WebView message:', error);
      Alert.alert('Error', 'Authentication failed. Please try again.');
      onClose();
    }
  };

  const startUrl = `http://localhost:3000/auth/${provider}/start`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Sign in with {provider === 'google' ? 'Google' : 'Apple'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color="#0C1E3C" size={24} />
          </TouchableOpacity>
        </View>
        <WebView
          ref={webViewRef}
          source={{ uri: startUrl }}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          allowsInlineMediaPlaybook={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </SafeAreaView>
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
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1E3C',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F4F6F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
  },
});