import React from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { t } from '../lib/i18n';

interface AppleSignInButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export default function AppleSignInButton({ onPress, disabled }: AppleSignInButtonProps) {
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={12}
      style={{
        width: '100%',
        height: 56,
        opacity: disabled ? 0.6 : 1,
      }}
      onPress={onPress}
      disabled={disabled}
    />
  );
}