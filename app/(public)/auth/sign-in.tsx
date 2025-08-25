import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import TextField from '../../../components/auth/TextField';
import FormButton from '../../../components/auth/FormButton';
import DividerOr from '../../../components/auth/DividerOr';
import GoogleSignInButton from '../../../components/GoogleSignInButton';
import AppleSignInButton from '../../../components/AppleSignInButton';
import AuthWebView from '../../../components/AuthWebView';
import { validateEmail } from '../../../utils/validation/email';
import { validatePassword } from '../../../utils/validation/password';
// import { t } from '../../../lib/i18n'; // вернёшь, когда подключишь ключи

function getBaseUrl() {
  // dev: iOS симулятор -> localhost; Android эмулятор -> 10.0.2.2; девайсы -> поставь свой LAN в .env
  if (__DEV__) {
    if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
    return 'http://localhost:3000';
  }
  return process.env.EXPO_PUBLIC_API_BASE_URL || 'https://xpaid.org';
}

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const [showAppleAuth, setShowAppleAuth] = useState(false);

  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;
    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;
    setErrors(newErrors);
    return { valid: Object.keys(newErrors).length === 0, newErrors };
  };

  const focusFirstError = (errs: { [key: string]: string }) => {
    if (errs.email && emailRef.current) {
      emailRef.current.focus();
    } else if (errs.password && passwordRef.current) {
      passwordRef.current.focus();
    }
  };

  const handleSubmit = async () => {
    setFormError('');

    const { valid, newErrors } = validateForm();
    if (!valid) {
      setFormError('Please fix the errors above');
      focusFirstError(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${getBaseUrl()}/auth/email/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || !data?.ok || !data?.token) {
        let errorMessage = 'Something went wrong, try again';
        switch (data?.code) {
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
        throw new Error(errorMessage);
      }

      await SecureStore.setItemAsync('auth_token', data.token);
      router.replace('/(tabs)/history');
    } catch (err: any) {
      console.error('Login error:', err);
      setFormError(err?.message || 'Network error. Please check your connection');
    } finally {
      setLoading(false);
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
        {formError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        ) : null}

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
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleCreateAccount} testID="signIn-createAccount">
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
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 32, paddingTop: 80, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '700', color: '#0C1E3C', marginBottom: 8, lineHeight: 38, textAlign: 'center' },
  subtitle: { fontSize: 16, fontWeight: '400', color: '#6B7280', lineHeight: 22, textAlign: 'center' },
  errorContainer: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 16, marginBottom: 24 },
  errorText: { fontSize: 14, fontWeight: '500', color: '#DC2626', textAlign: 'center' },
  form: { marginBottom: 32 },
  socialContainer: { gap: 12, marginBottom: 8 },
  forgotPasswordButton: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotPasswordText: { fontSize: 14, fontWeight: '500', color: '#3D8BFF' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto' },
  footerText: { fontSize: 16, fontWeight: '400', color: '#6B7280' },
  footerLink: { fontSize: 16, fontWeight: '600', color: '#3D8BFF' },
});
