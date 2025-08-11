import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import { t, getCurrentLanguage, changeLanguage } from '@/lib/i18n';

export default function SettingsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<'uk' | 'en'>(getCurrentLanguage());
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);


  const handleBack = () => {
    router.back();
  };

  const handleLanguageSelect = async (language: 'uk' | 'en') => {
    if (language === selectedLanguage || isChangingLanguage) return;
    
    setIsChangingLanguage(true);
    try {
      await changeLanguage(language);
      setSelectedLanguage(language);
      
      // Force re-render by navigating back and forth
      // This ensures all components pick up the new translations
      setTimeout(() => {
        router.back();
      }, 100);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const languages = [
    { code: 'uk' as const, name: t('ukrainian') },
    { code: 'en' as const, name: t('english') },
  ];


  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#0C1E3C" size={24} />
        </TouchableOpacity>
        <Text 
          style={styles.headerTitle}
          adjustsFontSizeToFit
          numberOfLines={1}
          minimumFontScale={0.7}
        >
          {t('settings')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Section */}
        <View style={styles.section}>
          <Text 
            style={styles.sectionTitle}
            adjustsFontSizeToFit
            numberOfLines={1}
            minimumFontScale={0.7}
          >
            {t('changeLanguage')}
          </Text>
          
          <View style={styles.languageContainer}>
            {languages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  selectedLanguage === language.code && styles.selectedLanguageOption,
                  isChangingLanguage && styles.disabledLanguageOption,
                ]}
                onPress={() => handleLanguageSelect(language.code)}
                activeOpacity={0.7}
                disabled={isChangingLanguage}
              >
                <Text style={[
                  styles.languageText,
                  selectedLanguage === language.code && styles.selectedLanguageText,
                  isChangingLanguage && styles.disabledLanguageText,
                ]}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
              >
                  {language.name}
                </Text>
                {selectedLanguage === language.code && (
                  <Check color="#3D8BFF" size={20} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
  backButton: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0C1E3C',
    marginBottom: 16,
    lineHeight: 24,
  },
  languageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedLanguageOption: {
    backgroundColor: '#3D8BFF' + '10',
  },
  disabledLanguageOption: {
    opacity: 0.6,
  },
  languageText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0C1E3C',
    lineHeight: 20,
  },
  selectedLanguageText: {
    fontWeight: '600',
    color: '#3D8BFF',
  },
  disabledLanguageText: {
    color: '#9CA3AF',
  },
});