import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import * as SecureStore from 'expo-secure-store';
import TextField from '../../../components/auth/TextField';
import FormButton from '../../../components/auth/FormButton';
import DividerOr from '../../../components/auth/DividerOr';
import GoogleSignInButton from '../../../components/GoogleSignInButton';
import AppleSignInButton from '../../../components/AppleSignInButton';
import AuthWebView from '../../../components/AuthWebView';
import { validateEmail } from '../../../utils/validation/email';
import { validatePassword } from '../../../utils/validation/password';
import { t } from '../../../lib/i18n';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const [showAppleAuth, setShowAppleAuth] = useState(false);

  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);
  const magicLinkEmailRef = useRef<any>(null);
  const magicLinkEmailRef = useRef<any>(null);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const focusFirstError = () => {
    if (errors.email && emailRef.current) {
    }
  }

  const handleMagicLinkSubmit = async () => {
    const emailError = validateEmail(magicLinkEmail);
    if (emailError) {
      Alert.alert('Invalid Email', emailError);
      return;
    }

    setMagicLinkLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: magicLinkEmail.trim(),
        options: {
          emailRedirectTo: 'myapp://auth/callback',
        },
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Check your email',
          'We sent you a magic link to sign in. Please check your email and click the link to continue.',
          [{ text: 'OK' }]
        );
        setMagicLinkEmail('');
      }
    } catch (error) {
      console.error('Magic link error:', error);
      Alert.alert('Error', 'Failed to send magic link. Please try again.');
    } finally {
      setMagicLinkLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setLoadingGoogle(true);
    setShowGoogleAuth(true);
  };

  const handleAppleSignIn = () => {
    setLoadingApple(true);
    setShowAppleAuth(true);
  };

  const handleCreateAccount = () => {
    router.push('/(public)/auth/sign-up');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Choose your sign in method</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Social Sign In */}
          <View style={styles.socialContainer}>
            <GoogleSignInButton
              onPress={handleGoogleSignIn}
              loading={loadingGoogle}
              disabled={magicLinkLoading}
            />
            
            <AppleSignInButton
              onPress={handleAppleSignIn}
              loading={loadingApple}
              disabled={magicLinkLoading}
            />
          </View>
          
          <DividerOr />
          
          {/* Magic Link Section */}
          <View style={styles.magicLinkSection}>
            <Text style={styles.magicLinkTitle}>Sign in with magic link</Text>
            <Text style={styles.magicLinkSubtitle}>
              Enter your email and we'll send you a secure link to sign in
            </Text>
            
            <TextField
              ref={magicLinkEmailRef}
              label="Email"
              value={magicLinkEmail}
              onChangeText={setMagicLinkEmail}
              testID="signIn-magicLinkEmail"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="done"
              onSubmitEditing={handleMagicLinkSubmit}
              placeholder="Enter your email address"
            />
            
            <FormButton
              title="Send Magic Link"
              loadingTitle="Sending magic link..."
              onPress={handleMagicLinkSubmit}
              loading={magicLinkLoading}
              testID="signIn-magicLink"
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity 
            onPress={handleCreateAccount}
            testID="signIn-createAccount"
          >
            <Text style={styles.footerLink}>Create account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* OAuth WebViews */}
      <AuthWebView
        visible={showGoogleAuth}
        provider="google"
        onClose={() => {
          setShowGoogleAuth(false);
          setLoadingGoogle(false);
        }}
      />
      
      <AuthWebView
        visible={showAppleAuth}
        provider="apple"
        onClose={() => {
          setShowAppleAuth(false);
          setLoadingApple(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0C1E3C',
    marginBottom: 8,
    lineHeight: 38,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 22,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  socialContainer: {
    gap: 12,
    marginBottom: 16,
  },
  magicLinkSection: {
    marginTop: 0,
  },
  magicLinkTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1E3C',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  magicLinkSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D8BFF',
  },
});