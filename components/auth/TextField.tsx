import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  testID?: string;
}

export default function TextField({ 
  label, 
  error, 
  testID, 
  style,
  ...props 
}: TextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        testID={testID}
        accessibilityLabel={label}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && (
        <Text style={styles.errorText} testID={`${testID}-error`}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C1E3C',
    marginBottom: 8,
    lineHeight: 20,
  },
  input: {
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
  inputError: {
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
});