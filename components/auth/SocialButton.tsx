import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Image,
  ImageSourcePropType,
} from 'react-native';

interface SocialButtonProps {
  icon: ImageSourcePropType;
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
}

export default function SocialButton({
  icon,
  label,
  onPress,
  loading = false,
  disabled = false,
  testID,
}: SocialButtonProps) {
  const isDisabled = loading || disabled;

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
            style={styles.icon} 
          />
        ) : (
          <Image source={icon} style={styles.icon} />
        )}
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
  icon: {
    width: 20,
    height: 20,
    marginRight: 12,
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