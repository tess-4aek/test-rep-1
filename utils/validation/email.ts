export function validateEmail(email: string): string | null {
  if (!email.trim()) {
    return 'Email is required';
  }

  // Basic RFC-style email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address';
  }

  return null;
}

export function isValidEmail(email: string): boolean {
  return validateEmail(email) === null;
}