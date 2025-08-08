import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en';
import uk from '../locales/uk';

// Create i18n instance
const i18n = new I18n({
  en,
  uk,
});

// Set fallback locale
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = 'user_language_preference';

// Function to detect system language and apply logic
function getDefaultLanguage(): string {
  const systemLocale = Localization.getLocales()[0]?.languageCode || 'en';
  console.log('System locale detected:', systemLocale);
  
  // If system language is Russian or Ukrainian, default to Ukrainian
  if (systemLocale === 'ru' || systemLocale === 'uk') {
    return 'uk';
  }
  
  // Otherwise default to English
  return 'en';
}

// Initialize language on app startup
export async function initializeLanguage(): Promise<void> {
  try {
    // Try to load saved language preference
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'uk')) {
      console.log('Using saved language preference:', savedLanguage);
      i18n.locale = savedLanguage;
    } else {
      // Use system detection logic
      const defaultLanguage = getDefaultLanguage();
      console.log('Using system-detected language:', defaultLanguage);
      i18n.locale = defaultLanguage;
      
      // Save the detected language as preference
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, defaultLanguage);
    }
  } catch (error) {
    console.error('Error initializing language:', error);
    // Fallback to system detection
    i18n.locale = getDefaultLanguage();
  }
}

// Function to change language and save preference
export async function changeLanguage(locale: 'en' | 'uk'): Promise<void> {
  try {
    i18n.locale = locale;
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
    console.log('Language changed and saved:', locale);
  } catch (error) {
    console.error('Error saving language preference:', error);
    // Still change the language even if saving fails
    i18n.locale = locale;
  }
}

// Get current language
export function getCurrentLanguage(): 'en' | 'uk' {
  return i18n.locale as 'en' | 'uk';
}

// Translation function
export function t(key: string, options?: any): string {
  return i18n.t(key, options);
}

// Export i18n instance for direct access if needed
export { i18n };