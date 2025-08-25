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
import { Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import appleAuth from '@invertase/react-native-apple-authentication';
import TextField from '../../../components/auth/TextField';
import FormButton from '../../../components/auth/FormButton';
import SocialButton from '../../../components/auth/SocialButton';
import DividerOr from '../../../components/auth/DividerOr';
import { validateEmail } from '../../../utils/validation/email';
import { validatePassword, validatePasswordConfirmation } from '../../../utils/validation/password';
import { storeAuthToken, storeAuthUser, AuthUser } from '../../../utils/auth/tokenStorage';
import { supabase } from '../../../lib/supabase';
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

  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);
  const confirmPasswordRef = useRef<any>(null);

  // Configure Google Sign-In
  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

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
    if (Platform.OS === 'web') {
      setFormError('Google Sign-In is not supported on web. Please use email/password.');
      return;
    }

    setLoadingGoogle(true);
    setFormError('');

    try {
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();
      
      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo.user) {
        throw new Error('No user information received from Google');
      }

      // Create or update user in Supabase
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('google_id', userInfo.user.id)
        .single();

      let user;
      if (existingUser) {
        // Update existing user
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            first_name: userInfo.user.givenName,
            last_name: userInfo.user.familyName,
            updated_at: new Date().toISOString(),
          })
          .eq('google_id', userInfo.user.id)
          .select()
          .single();

        if (updateError) throw updateError;
        user = updatedUser;
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: crypto.randomUUID(),
            first_name: userInfo.user.givenName,
            last_name: userInfo.user.familyName,
            google_id: userInfo.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) throw createError;
        user = newUser;
      }

      // Store user data locally
      const authUser: AuthUser = {
        id: user.id,
        email: userInfo.user.email || '',
        name: `${userInfo.user.givenName || ''} ${userInfo.user.familyName || ''}`.trim(),
        provider: 'google',
      };

      await storeAuthUser(authUser);
      
      console.log('Google sign-up successful:', authUser);
      
      // Navigate to protected route
      router.replace('/(tabs)/history');
      
    } catch (error: any) {
      console.error('Google sign-up error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the sign-in flow
        return;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        setFormError('Sign-in already in progress. Please wait.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setFormError('Google Play Services not available on this device.');
      } else {
        setFormError('Google sign-up failed. Please try again.');
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleAppleSignUp = async () => {
    if (Platform.OS !== 'ios') {
      setFormError('Apple Sign-In is only available on iOS devices.');
      return;
    }

    setLoadingApple(true);
    setFormError('');

    try {
      // Perform Apple Sign-In request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      // Ensure Apple returned a user
      if (!appleAuthRequestResponse.user) {
        throw new Error('Apple Sign-In was cancelled or failed');
      }

      const { user: appleUser, email, fullName } = appleAuthRequestResponse;

      // Create or update user in Supabase
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('apple_id', appleUser)
        .single();

      let user;
      if (existingUser) {
        // Update existing user
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            first_name: fullName?.givenName || existingUser.first_name,
            last_name: fullName?.familyName || existingUser.last_name,
            updated_at: new Date().toISOString(),
          })
          .eq('apple_id', appleUser)
          .select()
          .single();

        if (updateError) throw updateError;
        user = updatedUser;
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: crypto.randomUUID(),
            first_name: fullName?.givenName || 'Apple',
            last_name: fullName?.familyName || 'User',
            apple_id: appleUser,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) throw createError;
        user = newUser;
      }

      // Store user data locally
      const authUser: AuthUser = {
        id: user.id,
        email: email || '',
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        provider: 'apple',
      };

      await storeAuthUser(authUser);
      
      console.log('Apple sign-up successful:', authUser);
      
      // Navigate to protected route
      router.replace('/(tabs)/history');
      
    } catch (error: any) {
      console.error('Apple sign-up error:', error);
      
      if (error.code === appleAuth.Error.CANCELED) {
        // User cancelled the sign-in flow
        return;
      } else {
        setFormError('Apple sign-up failed. Please try again.');
      }
    } finally {
      setLoadingApple(false);
    }
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