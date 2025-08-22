import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { handlePostAuth } from '../utils/authGate';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    handlePostAuth(router);
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3D8BFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F6F9',
  },
});