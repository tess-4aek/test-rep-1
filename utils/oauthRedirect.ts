import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

export function getRedirectTo(): string {
  if (Platform.OS === 'web') {
    return window.location.origin + '/';
  }
  return Linking.createURL('auth-callback'); // e.g., xpaid://auth-callback
}