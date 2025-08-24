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
import { Platform, Alert } from 'react-native';
import TextField from '../../../components/auth/TextField';
import FormButton from '../../../components/auth/FormButton';
import SocialButton from '../../../components/auth/SocialButton';
import DividerOr from '../../../components/auth/DividerOr';
import OAuthWebView from '../../../components/auth/OAuthWebView';
import { validateEmail } from '../../../utils/validation/email';
import { validatePassword } from '../../../utils/validation/password';
import { storeAuthToken, storeAuthUser } from '../../../utils/auth/tokenStorage';
import { t } from '../../../lib/i18n';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [oauthWebView, setOauthWebView] = useState<{
    visible: boolean;
    url: string;
    title: string;
  }>({
    visible: false,
    url: '',
    title: '',
  });

  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);

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

    // Simulate API call
    setTimeout(() => {
      console.log('Sign In Form Data:', { email, password });
      setLoading(false);
      
      // Mock success - navigate to protected route
      router.replace('/(tabs)/history');
    }, 800);
  };

  const handleGoogleSignIn = async () => {
    setOauthWebView({
      visible: true,
      url: 'http://localhost:3000/auth/google/start',
      title: t('signIn') + ' - Google',
    });
  };

  const handleAppleSignIn = async () => {
    setOauthWebView({
      visible: true,
      url: 'http://localhost:3000/auth/apple/start',
      title: t('signIn') + ' - Apple',
    });
  };

  const handleOAuthMessage = async (data: any) => {
    setOauthWebView({ visible: false, url: '', title: '' });
    
    if (data.type === 'AUTH_SUCCESS') {
      try {
        // Store token and user data
        await storeAuthToken(data.token);
        await storeAuthUser(data.user);
        
        console.log('OAuth success:', data.user);
        
        // Navigate to protected route
        router.replace('/(tabs)/history');
      } catch (error) {
        console.error('Failed to store auth data:', error);
        setFormError('Authentication failed. Please try again.');
      }
    } else if (data.type === 'AUTH_ERROR') {
      console.error('OAuth error:', data.error);
      setFormError(data.error || 'Authentication failed. Please try again.');
    }
  };

  const handleCloseWebView = () => {
    setOauthWebView({ visible: false, url: '', title: '' });
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
            <SocialButton
              badgeText="G"
              label={t('continueWithGoogle') || 'Continue with Google'}
              onPress={handleGoogleSignIn}
              loading={loadingGoogle}
              disabled={loading || loadingApple}
              testID="social-google"
            />
            
            <SocialButton
              badgeText=""
              label={t('continueWithApple') || 'Continue with Apple'}
              onPress={handleAppleSignIn}
              loading={loadingApple}
              disabled={loading || loadingGoogle}
              testID="social-apple"
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
            disabled={loadingGoogle || loadingApple}
            testID="signIn-submit"
          />
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
      
      <OAuthWebView
        visible={oauthWebView.visible}
        url={oauthWebView.url}
        title={oauthWebView.title}
        onClose={handleCloseWebView}
        onMessage={handleOAuthMessage}
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