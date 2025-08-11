import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { Linking } from 'react-native';
import { t } from '@/lib/i18n';

export default function HelpAndSupportPage() {
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const faqData = [
    {
      question: t('increaseLimit'),
      answer: t('increaseLimitAnswer')
    },
    {
      question: t('exchangeFee'),
      answer: t('exchangeFeeAnswer')
    },
    {
      question: t('verificationTime'),
      answer: t('verificationTimeAnswer')
    },
    {
      question: t('supportedCurrencies'),
      answer: t('supportedCurrenciesAnswer')
    },
  ];

  const handleBack = () => {
    router.back();
  };

  const handleContactSupport = async () => {
    const message = encodeURIComponent(t('contactSupport'));
    const telegramUrl = `tg://resolve?domain=YourBotUsername&text=${message}`;
    
    try {
      await Linking.openURL(telegramUrl);
    } catch (error) {
      console.error('Error opening Telegram:', error);
    }
  };

  const toggleExpanded = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

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
          {t('helpAndSupport')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ Section */}
        <View style={styles.sectionContainer}>
          <Text 
            style={styles.sectionTitle}
            adjustsFontSizeToFit
            numberOfLines={1}
            minimumFontScale={0.7}
          >
            {t('frequentlyAskedQuestions')}
          </Text>
          
          <View style={styles.faqContainer}>
            {faqData.map((item, index) => (
              <View key={index} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleExpanded(index)}
                  activeOpacity={0.7}
                >
                  <Text 
                    style={styles.questionText}
                    adjustsFontSizeToFit
                    numberOfLines={2}
                    minimumFontScale={0.7}
                  >
                    {item.question}
                  </Text>
                  {expandedItems.includes(index) ? (
                    <ChevronUp color="#6B7280" size={20} />
                  ) : (
                    <ChevronDown color="#6B7280" size={20} />
                  )}
                </TouchableOpacity>
                
                {expandedItems.includes(index) && (
                  <View style={styles.faqAnswer}>
                    <Text 
                      style={styles.answerText}
                      adjustsFontSizeToFit
                      numberOfLines={2}
                      minimumFontScale={0.7}
                    >
                      {item.answer}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Contact Support Button */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={handleContactSupport}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#3D8BFF', '#2A7FFF']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MessageCircle color="#FFFFFF" size={20} style={styles.buttonIcon} />
            <Text 
              style={styles.contactButtonText}
              adjustsFontSizeToFit
              numberOfLines={1}
              minimumFontScale={0.7}
            >
              {t('contactSupport')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <Text 
          style={styles.footerText}
          adjustsFontSizeToFit
          numberOfLines={2}
          minimumFontScale={0.7}
        >
        {t('respondWithin1h')}
        </Text>
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
    paddingBottom: 20,
  },
  sectionContainer: {
    paddingHorizontal: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0C1E3C',
    marginBottom: 20,
    lineHeight: 24,
  },
  faqContainer: {
    gap: 12,
  },
  faqItem: {
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
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C1E3C',
    lineHeight: 20,
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  answerText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
  },
  ctaContainer: {
    backgroundColor: '#F4F6F9',
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 50,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  contactButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    shadowColor: '#3D8BFF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footerText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});