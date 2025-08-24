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
import { validatePassword, validatePasswordConfirmation } from '../../../utils/validation/password';
import { storeAuthToken, storeAuthUser } from '../../../utils/auth/tokenStorage';
import { t } from '../../../lib/i18n';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    if (errors.email && emailRef.current) {
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

    // Simulate API call
    setTimeout(() => {
      console.log('Sign Up Form Data:', { email, password, confirmPassword });
      setLoading(false);
      
      // Mock success - show banner and navigate to sign in
      Alert.alert(
        'Account Created',
        'Account created successfully. Please sign in.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(public)/auth/sign-in'),
          },
        ]
      );
    }, 800);
  };

  const handleGoogleSignUp = async () => {
    setOauthWebView({
      visible: true,
      url: 'http://localhost:3000/auth/google/start',
      title: 'Sign Up - Google',
    });
  };

  const handleAppleSignUp = async () => {
    setOauthWebView({
      visible: true,
      url: 'http://localhost:3000/auth/apple/start',
      title: 'Sign Up - Apple',
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
            <SocialButton
              badgeText="G"
              label={t('continueWithGoogle') || 'Continue with Google'}
              onPress={handleGoogleSignUp}
              loading={loadingGoogle}
              disabled={loading || loadingApple}
              testID="social-google"
            />
            
            <SocialButton
              badgeText=""
              label={t('continueWithApple') || 'Continue with Apple'}
              onPress={handleAppleSignUp}
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
            disabled={loadingGoogle || loadingApple}
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