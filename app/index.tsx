import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Zap, Shield, TrendingUp, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { t } from '@/lib/i18n';
import { LinearGradient } from 'expo-linear-gradient';

export default function IntroPage() {
  const handleSignIn = () => {
    router.push('/sign-in');
  };

  const handleSignUp = () => {
    router.push('/sign-up');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>{t('appName')}</Text>
        <Text style={styles.tagline}>{t('tagline')}</Text>
      </View>

      {/* Features */}
      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Zap color="#3D8BFF" size={32} />
          </View>
          <Text style={styles.featureTitle}>{t('instantExchange')}</Text>
          <Text style={styles.featureDescription}>{t('instantExchangeDesc')}</Text>
        </View>
        
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Shield color="#10B981" size={32} />
          </View>
          <Text style={styles.featureTitle}>{t('bankGradeSecurity')}</Text>
          <Text style={styles.featureDescription}>{t('bankGradeSecurityDesc')}</Text>
        </View>
        
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <TrendingUp color="#F59E0B" size={32} />
          </View>
          <Text style={styles.featureTitle}>{t('bestRates')}</Text>
          <Text style={styles.featureDescription}>{t('bestRatesDesc')}</Text>
        </View>
      </View>

      {/* CTA Buttons */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={handleSignIn}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#3D8BFF', '#2A7FFF']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.signInButtonText}>{t('signIn')}</Text>
            <ArrowRight color="#FFFFFF" size={20} />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.signUpButton}
          onPress={handleSignUp}
          activeOpacity={0.9}
        >
          <Text style={styles.signUpButtonText}>Create Account</Text>
        </TouchableOpacity>
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
    marginBottom: 40,
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
  featuresContainer: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    gap: 32,
  },
  featureItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0C1E3C',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  featureDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingBottom: 50,
    alignItems: 'center',
    gap: 16,
  },
  signInButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#3D8BFF',
    borderRadius: 16,
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
  buttonGradient: {
    flex: 1,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  signUpButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3D8BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpButtonText: {
    color: '#3D8BFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});