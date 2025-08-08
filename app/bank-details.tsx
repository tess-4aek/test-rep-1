import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { Linking } from 'react-native';
import { t } from '@/lib/i18n';
import { updateUserBankDetailsStatus } from '@/lib/supabase';
import { getUserData, saveUserData } from '@/utils/auth';

interface FormData {
  fullName: string;
  iban: string;
  swiftBic: string;
  bankName: string;
  country: string;
}

interface FormErrors {
  fullName?: string;
  iban?: string;
  swiftBic?: string;
  bankName?: string;
  country?: string;
}

export default function BankDetailsFormPage() {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    iban: '',
    swiftBic: '',
    bankName: '',
    country: '',
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateFullName = (value: string): string | undefined => {
    if (!value.trim()) {
      return t('fullNameRequired');
    }
    if (value.trim().length < 2) {
      return t('fullNameTooShort');
    }
    // Allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-ZÀ-ÿĀ-žА-я\s\-']+$/;
    if (!nameRegex.test(value.trim())) {
      return t('fullNameInvalid');
    }
    return undefined;
  };

  const validateIBAN = (value: string): string | undefined => {
    if (!value.trim()) {
      return t('ibanRequired');
    }
    
    // Remove spaces and convert to uppercase
    const cleanIban = value.replace(/\s/g, '').toUpperCase();
    
    if (cleanIban.length < 15) {
      return t('ibanTooShort');
    }
    
    // Basic IBAN format validation (2 letters + 2 digits + up to 30 alphanumeric)
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;
    if (!ibanRegex.test(cleanIban)) {
      return t('ibanInvalid');
    }
    
    return undefined;
  };

  const validateSwiftBic = (value: string): string | undefined => {
    if (!value.trim()) {
      return undefined; // Optional field
    }
    
    // SWIFT/BIC should be 8-11 characters
    const cleanSwift = value.replace(/\s/g, '').toUpperCase();
    const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
    
    if (cleanSwift.length < 8 || cleanSwift.length > 11 || !swiftRegex.test(cleanSwift)) {
      return t('swiftInvalid');
    }
    
    return undefined;
  };

  const validateBankName = (value: string): string | undefined => {
    if (!value.trim()) {
      return undefined; // Optional field
    }
    if (value.trim().length < 2) {
      return t('bankNameTooShort');
    }
    // Allow letters, numbers, spaces, hyphens, and common bank symbols
    const bankNameRegex = /^[a-zA-ZÀ-ÿĀ-žА-я0-9\s\-&.()]+$/;
    if (!bankNameRegex.test(value.trim())) {
      return t('bankNameInvalid');
    }
    return undefined;
  };

  const validateCountry = (value: string): string | undefined => {
    if (!value.trim()) {
      return t('countryRequired');
    }
    if (value.trim().length < 2) {
      return t('countryTooShort');
    }
    // Allow letters, spaces, and hyphens
    const countryRegex = /^[a-zA-ZÀ-ÿĀ-žА-я\s\-]+$/;
    if (!countryRegex.test(value.trim())) {
      return t('countryInvalid');
    }
    return undefined;
  };

  const validateField = (field: keyof FormData, value: string): string | undefined => {
    switch (field) {
      case 'fullName':
        return validateFullName(value);
      case 'iban':
        return validateIBAN(value);
      case 'swiftBic':
        return validateSwiftBic(value);
      case 'bankName':
        return validateBankName(value);
      case 'country':
        return validateCountry(value);
      default:
        return undefined;
    }
  };

  const validateAllFields = (): FormErrors => {
    const newErrors: FormErrors = {};
    
    Object.keys(formData).forEach((key) => {
      const field = key as keyof FormData;
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });
    
    return newErrors;
  };
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleInputBlur = (field: keyof FormData) => {
    setFocusedField(null);
    
    // Validate field on blur
    const error = validateField(field, formData[field]);
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  };

  const handleSubmit = async () => {
    // Validate all fields before submission
    const validationErrors = validateAllFields();
    setErrors(validationErrors);
    
    // Check if there are any errors
    const hasErrors = Object.values(validationErrors).some(error => error !== undefined);
    if (hasErrors || isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get current user data
      const currentUser = await getUserData();
      if (!currentUser) {
        console.error('No user data found');
        router.push('/');
        return;
      }

      if (!currentUser.telegram_id) {
        console.error('No telegram_id found for user');
        router.push('/review-pending');
        return;
      }

      console.log('Updating bank details for telegram_id:', currentUser.telegram_id);
      console.log('Form data:', formData);
      
      // Update bank details status in Supabase
      const updatedUser = await updateUserBankDetailsStatus(currentUser.telegram_id, {
        fullName: formData.fullName,
        iban: formData.iban,
        swiftBic: formData.swiftBic,
        bankName: formData.bankName,
        country: formData.country,
      });
      
      if (!updatedUser) {
        console.error('Failed to update bank details status');
        // Still navigate but show error
        router.push('/review-pending');
        return;
      }

      // Update local user data
      await saveUserData(updatedUser);
      console.log('Bank details status updated successfully');

      // Navigate to review pending page
      router.push('/review-pending');
      
    } catch (error) {
      console.error('Error submitting bank details:', error);
      // Still navigate on error to avoid blocking user
      router.push('/review-pending');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrderBankAccount = async () => {
    const message = encodeURIComponent('Привіт, я хочу замовити послугу відкриття банківського рахунку.');
    const telegramUrl = `tg://resolve?domain=YourBotUsername&start=${message}`;
    
    try {
      await Linking.openURL(telegramUrl);
    } catch (error) {
      console.error('Error opening Telegram:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isFormValid = () => {
    const validationErrors = validateAllFields();
    const hasErrors = Object.values(validationErrors).some(error => error !== undefined);
    return !hasErrors && formData.fullName.trim() !== '' && formData.iban.trim() !== '' && formData.country.trim() !== '';
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#0C1E3C" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('bankDetails')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Main Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.heading}>{t('enterBankDetails')}</Text>
          <Text style={styles.description}>
            {t('bankDetailsDescription')}
          </Text>

          {/* Bank Requirements Info Block */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoBlockTitle}>{t('bankRequirements')}</Text>
            <Text style={styles.infoBlockText}>
              {t('bankRequirementsText')}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t('fullName')} <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  focusedField === 'fullName' && styles.focusedInput,
                  errors.fullName && styles.errorInput,
                ]}
                value={formData.fullName}
                onChangeText={(value) => handleInputChange('fullName', value)}
                onFocus={() => setFocusedField('fullName')}
                onBlur={() => handleInputBlur('fullName')}
                placeholder={t('enterFullName')}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                autoComplete="name"
              />
              {errors.fullName && (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              )}
            </View>

            {/* IBAN */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t('iban')} <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  focusedField === 'iban' && styles.focusedInput,
                  errors.iban && styles.errorInput,
                ]}
                value={formData.iban}
                onChangeText={(value) => handleInputChange('iban', value)}
                onFocus={() => setFocusedField('iban')}
                onBlur={() => handleInputBlur('iban')}
                placeholder="GB29 NWBK 6016 1331 9268 19"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                autoComplete="off"
              />
              {errors.iban && (
                <Text style={styles.errorText}>{errors.iban}</Text>
              )}
            </View>

            {/* SWIFT/BIC */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('swiftBic')}</Text>
              <TextInput
                style={[
                  styles.textInput,
                  focusedField === 'swiftBic' && styles.focusedInput,
                  errors.swiftBic && styles.errorInput,
                ]}
                value={formData.swiftBic}
                onChangeText={(value) => handleInputChange('swiftBic', value)}
                onFocus={() => setFocusedField('swiftBic')}
                onBlur={() => handleInputBlur('swiftBic')}
                placeholder="NWBKGB2L"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                autoComplete="off"
              />
              {errors.swiftBic && (
                <Text style={styles.errorText}>{errors.swiftBic}</Text>
              )}
            </View>

            {/* Bank Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('bankName')}</Text>
              <TextInput
                style={[
                  styles.textInput,
                  focusedField === 'bankName' && styles.focusedInput,
                  errors.bankName && styles.errorInput,
                ]}
                value={formData.bankName}
                onChangeText={(value) => handleInputChange('bankName', value)}
                onFocus={() => setFocusedField('bankName')}
                onBlur={() => handleInputBlur('bankName')}
                placeholder={t('enterBankName')}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                autoComplete="off"
              />
              {errors.bankName && (
                <Text style={styles.errorText}>{errors.bankName}</Text>
              )}
            </View>

            {/* Country */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t('country')} <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  focusedField === 'country' && styles.focusedInput,
                  errors.country && styles.errorInput,
                ]}
                value={formData.country}
                onChangeText={(value) => handleInputChange('country', value)}
                onFocus={() => setFocusedField('country')}
                onBlur={() => handleInputBlur('country')}
                placeholder={t('enterCountry')}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                autoComplete="country"
              />
              {errors.country && (
                <Text style={styles.errorText}>{errors.country}</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={[
            styles.ctaButton,
            (!isFormValid() || isSubmitting) && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          activeOpacity={0.9}
          disabled={!isFormValid() || isSubmitting}
        >
          <LinearGradient
            colors={(isFormValid() && !isSubmitting) ? ['#3D8BFF', '#2A7FFF'] : ['#9CA3AF', '#9CA3AF']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.ctaButtonText}>
              {isSubmitting ? t('submitting') : t('submit')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleOrderBankAccount}
          activeOpacity={0.9}
        >
          <Text style={styles.secondaryButtonText}>{t('orderBankAccountOpening')}</Text>
        </TouchableOpacity>
        
        <Text style={styles.footerText}>
          {t('informationSecure')}
        </Text>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: 20,
  },
  contentContainer: {
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0C1E3C',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  formContainer: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C1E3C',
    marginBottom: 4,
  },
  required: {
    color: '#EF4444',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#0C1E3C',
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  focusedInput: {
    borderColor: '#3D8BFF',
    shadowColor: '#3D8BFF',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  errorInput: {
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#EF4444',
    marginTop: 4,
    lineHeight: 16,
  },
  infoBlock: {
    backgroundColor: '#EBF4FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowColor: '#3D8BFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  infoBlockTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
    lineHeight: 22,
  },
  infoBlockText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#1E40AF',
    lineHeight: 22,
  },
  ctaContainer: {
    backgroundColor: '#F4F6F9',
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 50,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  ctaButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3D8BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  secondaryButtonText: {
    color: '#3D8BFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footerText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});