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
import * as SecureStore from 'expo-secure-store';
import { postJSON, ApiError } from '../../../lib/api';
import TextField from '../../../components/auth/TextField';
import FormButton from '../../../components/auth/FormButton';
import DividerOr from '../../../components/auth/DividerOr';
import GoogleSignInButton from '../../../components/GoogleSignInButton';
import AppleSignInButton from '../../../components/AppleSignInButton';
import AuthWebView from '../../../components/AuthWebView';
import { validateEmail } from '../../../utils/validation/email';
import { validatePassword, validatePasswordConfirmation } from '../../../utils/validation/password';
import { t } from '../../../lib/i18n';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const [showAppleAuth, setShowAppleAuth] = useState(false);

  const nameRef = useRef<any>(null);
  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);
  const confirmPasswordRef = useRef<any>(null);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    const confirmPasswordError = validatePasswordConfirmation(password, confirmPassword);
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const focusFirstError = () => {
    if (errors.name && nameRef.current) {
      nameRef.current.focus();
    } else if (errors.email && emailRef.current) {
      emailRef.current.focus();
    } else if (errors.password && passwordRef.current) {
      passwordRef.current.focus();
    } else if (errors.confirmPassword && confirmPasswordRef.current) {
      confirmPasswordRef.current.focus();
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
      const data = await postJSON('/auth/email/register', {
        email: email.trim(),
        password,
        name: name.trim() || undefined,
      });

      if (data.ok && data.token) {
        // Store JWT in SecureStore
        await SecureStore.setItemAsync('auth_token', data.token);
        
        // Navigate to main app
        router.replace('/(tabs)/history');
      } else {
        // Handle server response without ok flag
        let errorMessage = 'Something went wrong, try again';
        
        switch (data.code) {
          case 'EMAIL_TAKEN':
            errorMessage = 'Email is already in use';
            break;
          case 'RATE_LIMITED':
            errorMessage = 'Too many attempts. Please try again later';
            break;
          case 'MISSING_FIELDS':
            errorMessage = 'Please fill in all required fields';
            break;
          case 'INVALID_EMAIL':
            errorMessage = 'Please enter a valid email address';
            break;
          case 'PASSWORD_TOO_SHORT':
            errorMessage = 'Password must be at least 8 characters long';
            break;
        }
        
        setFormError(errorMessage);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle API errors with proper user messages
      let errorMessage = 'Something went wrong, try again';
      
      if (error.code) {
        switch (error.code) {
          case 'EMAIL_TAKEN':
            errorMessage = 'Email is already in use';
            break;
          case 'RATE_LIMITED':
            errorMessage = 'Too many attempts. Please try again later';
            break;
          case 'MISSING_FIELDS':
            errorMessage = 'Please fill in all required fields';
            break;
          case 'INVALID_EMAIL':
            errorMessage = 'Please enter a valid email address';
            break;
          case 'PASSWORD_TOO_SHORT':
            errorMessage = 'Password must be at least 8 characters long';
            break;
          case 'TIMEOUT':
            errorMessage = 'Request timed out. Please try again';
            break;
          case 'NETWORK_ERROR':
            errorMessage = 'Network error. Please check your connection';
            break;
        }
      }
      
      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    setLoadingGoogle(true);
    setLoadingGoogle(true);
    setShowGoogleAuth(true);
  };

  const handleAppleSignUp = () => {
    setLoadingApple(true);
    setLoadingApple(true);
    setShowAppleAuth(true);
  };

  const handleSignIn = () => {
    router.push('/(public)/auth/sign-in');
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        {/* Form Error */}
        {formError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          {/* Social Sign Up */}
          <View style={styles.socialContainer}>
            <GoogleSignInButton
              onPress={handleGoogleSignUp}
              loading={loadingGoogle}
              disabled={loading}
              loading={loadingGoogle}
              disabled={loading}
            />
            
            <AppleSignInButton
              onPress={handleAppleSignUp}
              loading={loadingApple}
              disabled={loading}
              loading={loadingApple}
              disabled={loading}
            />
          </View>
          
          <DividerOr />
          
          {/* Email Form */}
          <TextField
            ref={nameRef}
            label="Name (Optional)"
            value={name}
            onChangeText={setName}
            testID="signUp-name"
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          <TextField
            ref={emailRef}
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            testID="signUp-email"
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
            testID="signUp-password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
          />

          <TextField
            ref={confirmPasswordRef}
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
            testID="signUp-confirmPassword"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          <FormButton
            title="Create Account"
            loadingTitle="Creating account..."
            onPress={handleSubmit}
            loading={loading}
            testID="signUp-submit"
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity 
            onPress={handleSignIn}
            testID="signUp-signIn"
          >
            <Text style={styles.footerLink}>Sign in</Text>
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
          setLoadingGoogle(false);
        }}
      />
      
      <AuthWebView
        visible={showAppleAuth}
        provider="apple"
        onClose={() => {
          setShowAppleAuth(false);
          setLoadingApple(false);
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