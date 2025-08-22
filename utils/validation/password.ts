export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  // Check for at least 1 digit
  if (!/\d/.test(password)) {
    return 'Password must contain at least 1 digit';
  }

  return null;
}

export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string
): string | null {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  return null;
}

export function isValidPassword(password: string): boolean {
  return validatePassword(password) === null;
}

export function doPasswordsMatch(password: string, confirmPassword: string): boolean {
  return validatePasswordConfirmation(password, confirmPassword) === null;
}