import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, ErrorBoundary } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initializeLanguage } from '@/lib/i18n';
import AuthGate from '@/components/AuthGate';

// Error Boundary Component
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color="#3D8BFF" />
        </View>
      );
    }

    return this.props.children;
  }
}

export default function RootLayout() {
  useFrameworkReady();
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize language first
        await initializeLanguage();
        setIsLanguageReady(true);
      } catch (error) {
        console.error('❌ Error during app initialization:', error);
        setIsLanguageReady(true);
      }
    };
    
    initializeApp();
  }, []);

  // Show loading screen until language and auth check are complete
  if (!isLanguageReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3D8BFF" />
      </View>
    );
  }

  return (
    <AppErrorBoundary>
      <>
        <AuthGate />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(public)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F9',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F9',
  },
});
