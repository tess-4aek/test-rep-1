// Email validation using RFC-compliant regex
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

// Password validation: at least 8 characters with at least one digit
export const validatePassword = (password: string): boolean => {
  return password.length >= 8 && /\d/.test(password);
};

// Get user-friendly error messages
export const getAuthErrorMessage = (error: any): string => {
  if (!error) return '';
  
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (message.includes('email not confirmed')) {
    return 'Please check your email and click the confirmation link before signing in.';
  }
  
  if (message.includes('user already registered')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  
  if (message.includes('password should be at least')) {
    return 'Password must be at least 8 characters long and contain at least one digit.';
  }
  
  if (message.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  
  if (message.includes('signup is disabled')) {
    return 'Account registration is currently disabled. Please contact support.';
  }
  
  if (message.includes('email rate limit exceeded')) {
    return 'Too many email requests. Please wait a few minutes before trying again.';
  }
  
  // Return the original message if we don't have a specific mapping
  return error.message || 'An unexpected error occurred. Please try again.';
};