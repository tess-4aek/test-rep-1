import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Complete the auth session for web
WebBrowser.maybeCompleteAuthSession();

interface AuthProvidersProps {
  onAuthSuccess: () => void;
  onAuthError: (error: string) => void;
}

export default function AuthProviders({ onAuthSuccess, onAuthError }: AuthProvidersProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  // Google Auth configuration
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID', // Replace with your Expo client ID
    iosClientId: 'YOUR_IOS_CLIENT_ID', // Replace with your iOS client ID
    androidClientId: 'YOUR_ANDROID_CLIENT_ID', // Replace with your Android client ID
    webClientId: 'YOUR_WEB_CLIENT_ID', // Replace with your Web client ID
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleSignIn(authentication?.accessToken);
    }
  }, [response]);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      onAuthError(t('emailPasswordRequired'));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = isSignUp
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: 'myapp://auth/callback',
            },
          })
        : await supabase.auth.signInWithPassword({
            email,
            password,
          });

      if (error) {
        onAuthError(error.message);
        return;
      }

      if (isSignUp && !data.session) {
        Alert.alert(
          t('checkEmail'),
          t('confirmationEmailSent'),
          [{ text: 'OK' }]
        );
        return;
      }

      if (data.session) {
        onAuthSuccess();
      }
    } catch (error: any) {
      onAuthError(error.message || t('authError'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (accessToken?: string) => {
    setGoogleLoading(true);
    try {
      if (accessToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: accessToken,
        });

        if (error) {
          onAuthError(error.message);
          return;
        }

        if (data.session) {
          onAuthSuccess();
        }
      } else {
        // Trigger Google OAuth flow
        promptAsync();
      }
    } catch (error: any) {
      onAuthError(error.message || t('googleAuthError'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios') {
      onAuthError(t('appleAuthIosOnly'));
      return;
    }

    setAppleLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) {
          onAuthError(error.message);
          return;
        }

        if (data.session) {
          onAuthSuccess();
        }
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User canceled Apple Sign In
        return;
      }
      onAuthError(error.message || t('appleAuthError'));
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Email/Password Form */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>
          {isSignUp ? t('createAccount') : t('signInWithEmail')}
        </Text>

        <View style={styles.inputContainer}>
          <Mail color="#6B7280" size={20} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder={t('email')}
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t('password')}
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              {showPassword ? (
                <EyeOff color="#6B7280" size={20} />
              ) : (
                <Eye color="#6B7280" size={20} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.emailButton}
          onPress={handleEmailAuth}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#9CA3AF', '#9CA3AF'] : ['#3D8BFF', '#2A7FFF']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? t('signUp') : t('signIn')}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsSignUp(!isSignUp)}
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>
            {isSignUp ? t('alreadyHaveAccount') : t('dontHaveAccount')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('orContinueWith')}</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social Auth Buttons */}
      <View style={styles.socialContainer}>
        {/* Google Sign In */}
        <TouchableOpacity
          style={styles.socialButton}
          onPress={() => handleGoogleSignIn()}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator color="#4285F4" size="small" />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.socialButtonText}>{t('continueWithGoogle')}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Apple Sign In - iOS only */}
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  formContainer: {
    marginBottom: 32,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0C1E3C',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#0C1E3C',
  },
  passwordContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#0C1E3C',
    paddingLeft: 32,
  },
  eyeIcon: {
    padding: 4,
  },
  emailButton: {
    height: 56,
    borderRadius: 16,
    marginBottom: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 14,
    color: '#3D8BFF',
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  socialContainer: {
    gap: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C1E3C',
  },
  appleButton: {
    height: 56,
  },
});