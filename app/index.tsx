import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Zap, Shield, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { t } from '@/lib/i18n';

import { resetAll } from '../scripts/resetAll.ts';

const { width: screenWidth } = Dimensions.get('window');

export default function IntroPage() {
  const scrollViewRef = useRef<ScrollView>(null);
  const currentIndex = useRef(0);

  const slides = [
    {
      id: 1,
      title: t('instantExchange'),
      subtitle: t('instantExchangeDesc'),
      icon: <Zap color="#3D8BFF" size={48} />,
    },
    {
      id: 2,
      title: t('bankGradeSecurity'),
      subtitle: t('bankGradeSecurityDesc'),
      icon: <Shield color="#10B981" size={48} />,
    },
    {
      id: 3,
      title: t('bestRates'),
      subtitle: t('bestRatesDesc'),
      icon: <TrendingUp color="#F59E0B" size={48} />,
    },
  ];

  useEffect(() => {
  resetAll();
    
    const interval = setInterval(() => {
      currentIndex.current = (currentIndex.current + 1) % slides.length;
      
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: currentIndex.current * screenWidth,
          animated: true,
        });
      }
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const handleSignIn = () => {
    // Navigate to email sign-in screen
    router.push('/(public)/auth/sign-in');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>{t('appName')}</Text>
        <Text style={styles.tagline}>{t('tagline')}</Text>
      </View>

      {/* Horizontal Slider */}
      <View style={styles.sliderContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          style={styles.slider}
        >
          {slides.map((slide) => (
            <View key={slide.id} style={styles.slide}>
              <View style={styles.slideContent}>
                <View style={styles.iconContainer}>
                  {slide.icon}
                </View>
                <Text style={styles.slideTitle}>{slide.title}</Text>
                <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Sign In Button */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={handleSignIn}
          activeOpacity={0.9}
        >
          <Text style={styles.signInButtonText}>{t('signIn')}</Text>
        </TouchableOpacity>
        
        <Text style={styles.footerText}>
          Secure email authentication
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 80,
    marginBottom: 60,
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0C1E3C',
    marginBottom: 8,
    lineHeight: 38,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 22,
    textAlign: 'center',
  },
  sliderContainer: {
    height: 320,
    marginBottom: 60,
  },
  slider: {
    flex: 1,
  },
  slide: {
    width: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  slideContent: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 40,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0C1E3C',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  slideSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  ctaContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingBottom: 60,
    alignItems: 'center',
  },
  signInButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#3D8BFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3D8BFF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  signInButtonText: {
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