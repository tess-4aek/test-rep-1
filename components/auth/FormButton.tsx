import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface FormButtonProps {
  title: string;
  loadingTitle?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  variant?: 'primary' | 'secondary';
}

export default function FormButton({
  title,
  loadingTitle,
  onPress,
  loading = false,
  disabled = false,
  testID,
  variant = 'primary',
}: FormButtonProps) {
  const isDisabled = loading || disabled;
  const displayTitle = loading && loadingTitle ? loadingTitle : title;

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        style={[
          styles.secondaryButton,
          isDisabled && styles.disabledSecondaryButton,
        ]}
        onPress={onPress}
        disabled={isDisabled}
        testID={testID}
        accessibilityLabel={title}
        activeOpacity={0.7}
      >
        <View style={styles.buttonContent}>
          {loading && (
            <ActivityIndicator 
              size="small" 
              color="#3D8BFF" 
              style={styles.spinner} 
            />
          )}
          <Text style={[
            styles.secondaryButtonText,
            isDisabled && styles.disabledSecondaryButtonText,
          ]}>
            {displayTitle}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.primaryButton,
        isDisabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      accessibilityLabel={title}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={isDisabled ? ['#9CA3AF', '#9CA3AF'] : ['#3D8BFF', '#2A7FFF']}
        style={styles.buttonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.buttonContent}>
          {loading && (
            <ActivityIndicator 
              size="small" 
              color="#FFFFFF" 
              style={styles.spinner} 
            />
          )}
          <Text style={styles.primaryButtonText}>
            {displayTitle}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3D8BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSecondaryButton: {
    borderColor: '#9CA3AF',
  },
  secondaryButtonText: {
    color: '#3D8BFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  disabledSecondaryButtonText: {
    color: '#9CA3AF',
  },
});