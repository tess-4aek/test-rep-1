import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import TextField from '../../../components/auth/TextField';
import FormButton from '../../../components/auth/FormButton';
import { validatePassword, validatePasswordConfirmation } from '../../../utils/validation/password';

export default function ResetPasswordPage() {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const codeRef = useRef<any>(null);
  const newPasswordRef = useRef<any>(null);
  const confirmNewPasswordRef = useRef<any>(null);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!code.trim()) {
      newErrors.code = 'Reset code is required';
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) newErrors.newPassword = passwordError;

    const confirmPasswordError = validatePasswordConfirmation(newPassword, confirmNewPassword);
    if (confirmPasswordError) newErrors.confirmNewPassword = confirmPasswordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const focusFirstError = () => {
    if (errors.code && codeRef.current) {
      codeRef.current.focus();
    } else if (errors.newPassword && newPasswordRef.current) {
      newPasswordRef.current.focus();
    } else if (errors.confirmNewPassword && confirmNewPasswordRef.current) {
      confirmNewPasswordRef.current.focus();
    }
  };

  const handleSubmit = async () => {
    setFormError('');
    setSuccessMessage('');
    
    if (!validateForm()) {
      setFormError('Please fix the errors above');
      setTimeout(focusFirstError, 100);
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      console.log('Reset Password Form Data:', { code, newPassword, confirmNewPassword });
      setLoading(false);
      
      // Mock success - show success message
      setSuccessMessage('Password updated. You can sign in now.');
    }, 800);
  };

  const handleBack = () => {
    router.back();
  };

  const handleSignIn = () => {
    router.push('/(public)/auth/sign-in');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#0C1E3C" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reset Password</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Create New Password</Text>
          <Text style={styles.subtitle}>
            Enter the reset code from your email and create a new password
          </Text>
        </View>

        {/* Form Error */}
        {formError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        )}

        {/* Success Message */}
        {successMessage && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <TextField
            ref={codeRef}
            label="Reset Code"
            value={code}
            onChangeText={setCode}
            error={errors.code}
            testID="reset-code"
            keyboardType="default"
            autoCapitalize="characters"
            returnKeyType="next"
            onSubmitEditing={() => newPasswordRef.current?.focus()}
            placeholder="Enter reset code"
          />

          <TextField
            ref={newPasswordRef}
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            error={errors.newPassword}
            testID="reset-newPassword"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            returnKeyType="next"
            onSubmitEditing={() => confirmNewPasswordRef.current?.focus()}
          />

          <TextField
            ref={confirmNewPasswordRef}
            label="Confirm New Password"
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            error={errors.confirmNewPassword}
            testID="reset-confirmNewPassword"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          <FormButton
            title="Update Password"
            loadingTitle="Updating..."
            onPress={handleSubmit}
            loading={loading}
            testID="reset-submit"
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Remember your password? </Text>
          <TouchableOpacity 
            onPress={handleSignIn}
            testID="reset-signIn"
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#F4F6F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1E3C',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0C1E3C',
    marginBottom: 16,
    lineHeight: 34,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
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
  successContainer: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  successText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#15803D',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
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