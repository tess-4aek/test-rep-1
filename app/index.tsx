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
      emailRef.current.focus();
    } else if (errors.password && passwordRef.current) {
      passwordRef.current.focus();
    }
  };

  const handleSubmit = async () => {
    setFormError('');
    
    if (!validateForm()) {
      setFormError('Please fix the errors above');
      setTimeout(focusFirstError, 100);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/auth/email/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (data.ok && data.token) {
        // Store JWT in SecureStore
        await SecureStore.setItemAsync('auth_token', data.token);
        
        // Navigate to main app
        router.replace('/(tabs)/history');
      } else {
        // Handle error codes
        let errorMessage = 'Something went wrong, try again';
        
        switch (data.code) {
          case 'INVALID_CREDENTIALS':
            errorMessage = 'Invalid email or password';
            break;
          case 'RATE_LIMITED':
            errorMessage = 'Too many attempts. Please try again later';
            break;
          case 'MISSING_FIELDS':
            errorMessage = 'Please fill in all fields';
            break;
          case 'INVALID_EMAIL':
            errorMessage = 'Please enter a valid email address';
            break;
        }
        
        setFormError(errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      setFormError('Network error. Please check your connection');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkSubmit = async () => {
    const emailError = validateEmail(magicLinkEmail);
    if (emailError) {
      Alert.alert('Invalid Email', emailError);
      return;
    }

    setMagicLinkLoading(true);

    try {
      // Simulate magic link API call
      console.log('Magic Link Email:', magicLinkEmail);
      
      // Mock success
      setTimeout(() => {
        setMagicLinkLoading(false);
        Alert.alert(
          'Check your email',
          'We sent you a magic link to sign in. Please check your email and click the link to continue.',
          [{ text: 'OK' }]
        );
        setMagicLinkEmail('');
      }, 800);
    } catch (error) {
      console.error('Magic link error:', error);
      setMagicLinkLoading(false);
      Alert.alert('Error', 'Failed to send magic link. Please try again.');
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

  const handleForgotPassword = () => {
    router.push('/(public)/auth/forgot');
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
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* Form Error */}
        {formError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          {/* Social Sign In */}
          <View style={styles.socialContainer}>
            <GoogleSignInButton
              onPress={handleGoogleSignIn}
              loading={loadingGoogle}
              disabled={loading}
            />
            
            <AppleSignInButton
              onPress={handleAppleSignIn}
              loading={loadingApple}
              disabled={loading}
            />
          </View>
          
          <DividerOr />
          
          {/* Email Form */}
          <TextField
            ref={emailRef}
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            testID="signIn-email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <TextField
            ref={passwordRef}
            label="Password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            testID="signIn-password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          <TouchableOpacity 
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
            testID="signIn-forgotPassword"
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          <FormButton
            title="Sign In"
            loadingTitle="Signing in..."
            onPress={handleSubmit}
            loading={loading}
            testID="signIn-submit"
          />

          {/* Magic Link Section */}
          <View style={styles.magicLinkSection}>
            <DividerOr />
            
            <Text style={styles.magicLinkTitle}>Or sign in with magic link</Text>
            <Text style={styles.magicLinkSubtitle}>
              Enter your email and we'll send you a secure link to sign in
            </Text>
            
            <TextField
              ref={magicLinkEmailRef}
              label="Email for magic link"
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
              variant="secondary"
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
    marginBottom: 8,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3D8BFF',
  },
  magicLinkSection: {
    marginTop: 8,
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