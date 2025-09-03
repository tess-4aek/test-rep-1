import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, ArrowRight, Check } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { saveUserData, saveUserUUID } from '@/utils/auth';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

// Create redirect URL for OAuth
const redirectUrl = AuthSession.makeRedirectUri({
  scheme: 'myapp'
});

export default function AuthPage() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('🔗 Starting Google OAuth with redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // We'll handle the browser manually
        },
      });

      if (error) {
        throw error;
      }

      console.log('🔗 Google OAuth URL generated:', data.url);
      
      // Open the OAuth URL in browser
      if (data.url) {
        console.log('🚀 Opening OAuth URL in browser...');
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );
        
        console.log('📱 OAuth result:', result);
        
        if (result.type === 'success' && result.url) {
          console.log('✅ OAuth redirect received:', result.url);
          
          // Handle the redirect URL
          const url = new URL(result.url);
          
          // Check for error in URL
          const error = url.searchParams.get('error');
          if (error) {
            throw new Error(`OAuth error: ${error}`);
          }
          
          // Extract tokens from URL fragment (Google OAuth uses fragment, not query params)
          const fragment = url.hash.substring(1);
          const params = new URLSearchParams(fragment);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          console.log('🔑 Extracted tokens:', { 
            hasAccessToken: !!accessToken, 
            hasRefreshToken: !!refreshToken 
          });
          
          if (accessToken) {
            console.log('✅ OAuth tokens received, setting session...');
            
            // Set the session with the received tokens
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (sessionError) {
              throw sessionError;
            }
            
            if (sessionData.user) {
              console.log('✅ Google OAuth successful for user:', sessionData.user.id);
              
              // Create or update user in our database
              const { data: userData, error: userError } = await supabase
                .from('users')
                .upsert({
                  id: sessionData.user.id,
                  email: sessionData.user.email,
                  username: sessionData.user.user_metadata?.full_name || sessionData.user.email?.split('@')[0],
                  google_id: sessionData.user.user_metadata?.sub,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .select()
                .single();

              if (userError) {
                console.error('❌ Error creating/updating user:', userError);
              } else {
                // Save user data locally
                await saveUserData(userData);
                await saveUserUUID(sessionData.user.id);
                console.log('💾 Google user data saved locally');
              }

              // Navigate to main app
              router.replace('/(tabs)');
            }
          }
        } else if (result.type === 'cancel') {
          console.log('🚫 User cancelled Google OAuth');
          // Don't show error for user cancellation
        }
      }
      
    } catch (error: any) {
      console.error('❌ Google OAuth error:', error);
      setError(error.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendOTP = async () => {
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true,
          data: {
            email_confirm: false,
          }
        }
      });

      if (error) {
        throw error;
      }

      // Log for development - Note: In production, the actual OTP code is not accessible for security
      console.log('📧 OTP EMAIL SENT');
      console.log('📬 Email address:', email.toLowerCase().trim());
      console.log('🔢 A 6-digit verification code has been sent to the email address');
      console.log('⚠️  NOTE: For security reasons, the actual OTP code is only visible in the email');
      console.log('📱 Please check your email and enter the 6-digit code in the app');
      setStep('otp');
      setResendCooldown(60); // 60 seconds cooldown
      console.log('✅ OTP sent successfully to:', email);
    } catch (error: any) {
      console.error('❌ Error sending OTP:', error);
      setError(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste operation
      const pastedCode = value.slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedCode[i] || '';
      }
      setOtp(newOtp);
      
      // Focus the last filled input or the next empty one
      const nextIndex = Math.min(pastedCode.length, 5);
      otpRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: otpCode,
        type: 'email'
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        console.log('✅ OTP verified successfully for user:', data.user.id);
        console.log('🎉 AUTHENTICATION SUCCESSFUL');
        console.log('👤 User ID:', data.user.id);
        console.log('📧 Email:', data.user.email);
        
        // Create or update user in our database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            username: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (userError) {
          console.error('❌ Error creating/updating user:', userError);
        } else {
          // Save user data locally
          await saveUserData(userData);
          await saveUserUUID(data.user.id);
          console.log('💾 User data saved locally');
        }

        // Navigate to main app
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('❌ Error verifying OTP:', error);
      setError(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) {
        throw error;
      }

      // Log for development
      console.log('📧 OTP EMAIL RESENT');
      console.log('📬 Email address:', email.toLowerCase().trim());
      console.log('🔢 A new 6-digit verification code has been sent');
      setResendCooldown(60);
      console.log('✅ OTP resent successfully to:', email);
    } catch (error: any) {
      console.error('❌ Error resending OTP:', error);
      // Show user-friendly error message instead of crashing
      setError('Unable to resend code right now. Please wait a moment and try again, or contact support if the issue persists.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp(['', '', '', '', '', '']);
    setError('');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#3D8BFF', '#2A7FFF']}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Mail color="#FFFFFF" size={32} />
            </LinearGradient>
          </View>
          
          <Text style={styles.title}>
            {step === 'email' ? 'Welcome' : 'Verify Email'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'email' 
              ? 'Choose your preferred sign-in method' 
              : `We sent a 6-digit code to ${email}`
            }
          </Text>
        </View>

        {/* Email Step */}
        {step === 'email' && (
          <View style={styles.formContainer}>
            {/* Google Sign In Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={loading}
              activeOpacity={0.9}
            >
              <View style={styles.googleButtonContent}>
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                {loading ? (
                  <ActivityIndicator color="#1F2937" size="small" />
                ) : (
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Continue with Email</Text>
              <TextInput
                style={styles.emailInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, (!email || loading) && styles.disabledButton]}
              onPress={handleSendOTP}
              disabled={!email || loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={email && !loading ? ['#3D8BFF', '#2A7FFF'] : ['#9CA3AF', '#9CA3AF']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Send Verification Code</Text>
                    <ArrowRight color="#FFFFFF" size={20} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <View style={styles.formContainer}>
            <View style={styles.otpContainer}>
              <Text style={styles.inputLabel}>Verification Code</Text>
              <View style={styles.otpInputContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (otpRefs.current[index] = ref)}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFilled,
                      error && styles.otpInputError
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOTPChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleOTPKeyPress(nativeEvent.key, index)}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    selectTextOnFocus
                  />
                ))}
              </View>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, (otp.join('').length !== 6 || loading) && styles.disabledButton]}
              onPress={handleVerifyOTP}
              disabled={otp.join('').length !== 6 || loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={otp.join('').length === 6 && !loading ? ['#3D8BFF', '#2A7FFF'] : ['#9CA3AF', '#9CA3AF']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Verify</Text>
                    <Check color="#FFFFFF" size={20} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Resend and Back Options */}
            <View style={styles.otpActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleBackToEmail}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>Change Email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, resendCooldown > 0 && styles.disabledButton]}
                onPress={handleResendOTP}
                disabled={resendCooldown > 0 || loading}
              >
                <Text style={[styles.secondaryButtonText, resendCooldown > 0 && styles.disabledText]}>
                  {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0C1E3C',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C1E3C',
    marginBottom: 8,
    lineHeight: 20,
  },
  emailInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#0C1E3C',
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  otpContainer: {
    marginBottom: 24,
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '700',
    color: '#0C1E3C',
    textAlign: 'center',
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  otpInputFilled: {
    borderColor: '#3D8BFF',
    backgroundColor: '#F0F7FF',
  },
  otpInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
    textAlign: 'center',
    lineHeight: 18,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#3D8BFF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  disabledButton: {
    shadowOpacity: 0.1,
  },
  buttonGradient: {
    flex: 1,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  otpActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D8BFF',
    lineHeight: 20,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  googleButton: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  googleButtonContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
});