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
import { supabase } from '../lib/supabase';
import * as SecureStore from 'expo-secure-store';
import TextField from '../components/auth/TextField';
import FormButton from '../components/auth/FormButton';
import DividerOr from '../components/auth/DividerOr';
import GoogleSignInButton from '../components/GoogleSignInButton';
import AppleSignInButton from '../components/AppleSignInButton';
import AuthWebView from '../components/AuthWebView';
import { validateEmail } from '../utils/validation/email';
import { t } from '../lib/i18n';

export default function SignInPage() {
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const [showAppleAuth, setShowAppleAuth] = useState(false);

  const otpEmailRef = useRef<any>(null);
  const otpCodeRef = useRef<any>(null);

  const validateEmailForm = () => {
    const newErrors: { [key: string]: string } = {};

    const emailError = validateEmail(otpEmail);
    if (emailError) newErrors.otpEmail = emailError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtpForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!otpCode.trim()) {
      newErrors.otpCode = 'Verification code is required';
    } else if (!/^\d{6}$/.test(otpCode.trim())) {
      newErrors.otpCode = 'Verification code must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async () => {
    setFormError('');
    
    if (!validateEmailForm()) {
      setFormError('Please enter a valid email address');
      return;
    }

    setSendingOtp(true);

    try {
      // Call your Edge Function to send OTP
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/send-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`,
        },
        body: JSON.stringify({
          email: otpEmail.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      // Show OTP input field
      setShowOtpInput(true);
      setFormError('');
      
      // Focus on OTP input
      setTimeout(() => {
        otpCodeRef.current?.focus();
      }, 100);
      
    } catch (error) {
      console.error('Send OTP error:', error);
      setFormError(error.message || 'Failed to send verification code. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setFormError('');
    
    if (!validateOtpForm()) {
      setFormError('Please enter a valid 6-digit verification code');
      return;
    }

    setVerifyingOtp(true);

    try {
      // Call your Edge Function to verify OTP
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/verify-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`,
        },
        body: JSON.stringify({
          email: otpEmail.trim(),
          otp_code: otpCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid verification code');
      }

      // Handle successful authentication
      if (data.session) {
        // Set the session in Supabase client
        await supabase.auth.setSession(data.session);
        
        // Navigate to main app
        router.replace('/(tabs)');
      } else {
        throw new Error('No session received from server');
      }
      
    } catch (error) {
      console.error('Verify OTP error:', error);
      setFormError(error.message || 'Invalid verification code. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleBackToEmail = () => {
    setShowOtpInput(false);
    setOtpCode('');
    setErrors({});
    setFormError('');
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
          <Text style={styles.subtitle}>
            {showOtpInput ? 'Enter verification code' : 'Choose your sign in method'}
          </Text>
        </View>

        {/* Form Error */}
        {formError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          {!showOtpInput && (
            <>
              {/* Social Sign In */}
              <View style={styles.socialContainer}>
                <GoogleSignInButton
                  onPress={handleGoogleSignIn}
                  loading={loadingGoogle}
                  disabled={sendingOtp || verifyingOtp}
                />
                
                <AppleSignInButton
                  onPress={handleAppleSignIn}
                  loading={loadingApple}
                  disabled={sendingOtp || verifyingOtp}
                />
              </View>
              
              <DividerOr />
            </>
          )}
          
          {/* Email OTP Section */}
          <View style={styles.otpSection}>
            {!showOtpInput ? (
              <>
                <Text style={styles.otpTitle}>Sign in with email</Text>
                <Text style={styles.otpSubtitle}>
                  Enter your email and we'll send you a 6-digit verification code
                </Text>
                
                <TextField
                  ref={otpEmailRef}
                  label="Email"
                  value={otpEmail}
                  onChangeText={setOtpEmail}
                  error={errors.otpEmail}
                  testID="signIn-otpEmail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="done"
                  onSubmitEditing={handleSendOtp}
                  placeholder="Enter your email address"
                />
                
                <FormButton
                  title="Send Verification Code"
                  loadingTitle="Sending code..."
                  onPress={handleSendOtp}
                  loading={sendingOtp}
                  testID="signIn-sendOtp"
                />
              </>
            ) : (
              <>
                <Text style={styles.otpTitle}>Check your email</Text>
                <Text style={styles.otpSubtitle}>
                  We sent a 6-digit verification code to {otpEmail}
                </Text>
                
                <TextField
                  ref={otpCodeRef}
                  label="Verification Code"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  error={errors.otpCode}
                  testID="signIn-otpCode"
                  keyboardType="numeric"
                  autoCapitalize="none"
                  autoComplete="one-time-code"
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyOtp}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
                
                <FormButton
                  title="Verify Code"
                  loadingTitle="Verifying..."
                  onPress={handleVerifyOtp}
                  loading={verifyingOtp}
                  testID="signIn-verifyOtp"
                />
                
                <View style={styles.otpActions}>
                  <TouchableOpacity 
                    onPress={handleBackToEmail}
                    style={styles.backToEmailButton}
                    disabled={verifyingOtp}
                  >
                    <Text style={styles.backToEmailText}>Change email</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={handleSendOtp}
                    style={styles.resendButton}
                    disabled={sendingOtp || verifyingOtp}
                  >
                    <Text style={styles.resendText}>
                      {sendingOtp ? 'Sending...' : 'Resend code'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Footer */}
        {!showOtpInput && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity 
              onPress={handleCreateAccount}
              testID="signIn-createAccount"
            >
              <Text style={styles.footerLink}>Create account</Text>
            </TouchableOpacity>
          </View>
        )}
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
  otpSection: {
    marginTop: 0,
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1E3C',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  otpSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  otpActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  backToEmailButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backToEmailText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resendText: {
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