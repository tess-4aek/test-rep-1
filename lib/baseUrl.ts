import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Get the appropriate base URL for API requests based on environment and platform
 */
export function getBaseUrl(): string {
  // Production/staging builds
  if (!__DEV__) {
    const prodUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (!prodUrl) {
      throw new Error('EXPO_PUBLIC_API_BASE_URL must be set for production builds');
    }
    return prodUrl;
  }

  // Development builds
  const devLanUrl = process.env.EXPO_PUBLIC_DEV_LAN_URL;
  
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to reach host localhost
    // Physical Android devices need LAN IP
    if (Constants.isDevice && devLanUrl) {
      return devLanUrl;
    }
    return 'http://10.0.2.2:3000';
  }
  
  if (Platform.OS === 'ios') {
    // iOS simulator can use localhost
    // Physical iOS devices need LAN IP
    if (Constants.isDevice && devLanUrl) {
      return devLanUrl;
    }
    return 'http://localhost:3000';
  }
  
  // Web and other platforms
  return 'http://localhost:3000';
}

export const BASE_URL = getBaseUrl();