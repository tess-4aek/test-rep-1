import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';

interface SocialButtonProps {
  badgeText?: string;
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
}

export default function SocialButton({
  badgeText,
  label,
  onPress,
  loading = false,
  disabled = false,
  testID,
}: SocialButtonProps) {
  const isDisabled = loading || disabled;

  // Fallback for Apple symbol if it doesn't render properly
  const displayBadgeText = badgeText === '' ? 'A' : badgeText;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isDisabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      accessibilityLabel={label}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color="#6B7280" 
            style={styles.badge} 
          />
        ) : badgeText ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{displayBadgeText}</Text>
          </View>
        ) : null}
        <Text style={[
          styles.label,
          isDisabled && styles.disabledLabel,
        ]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C1E3C',
    lineHeight: 20,
  },
  disabledLabel: {
    color: '#9CA3AF',
  },
});