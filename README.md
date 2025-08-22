# CryptoExchange App

A React Native Expo app for secure cryptocurrency exchanges with email/password authentication via Supabase.

## Features

- **Email/Password Authentication**: Secure sign up, sign in, and password reset
- **Session Management**: Automatic session refresh and secure storage
- **Multi-language Support**: English and Ukrainian
- **KYC Verification**: Identity verification flow
- **Bank Details**: Secure bank account information management
- **Order Management**: Create and track exchange orders
- **Responsive Design**: Works on iOS, Android, and Web

## Authentication Flow

1. **Sign Up**: Create account with email/password
2. **Email Verification**: Verify email address (if enabled)
3. **Sign In**: Authenticate with credentials
4. **Session Management**: Automatic token refresh
5. **Password Reset**: Secure password recovery

## Environment Setup

1. Copy `.env.example` to `.env`
2. Add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for web
npm run build:web
```

## Project Structure

```
app/
├── (tabs)/          # Main app tabs (protected)
├── sign-in.tsx      # Sign in screen
├── sign-up.tsx      # Sign up screen
├── forgot-password.tsx
├── email-verification.tsx
├── reset-password.tsx
└── _layout.tsx      # Root layout with auth guard

utils/
├── auth.ts          # Authentication utilities
└── supabase.ts      # Supabase client

store/
└── useAuth.ts       # Global auth state management

components/
└── AuthGuard.tsx    # Route protection component
```

## Authentication API

### Sign Up
```typescript
const result = await signUp(email, password);
if (result.success) {
  // Handle success
}
```

### Sign In
```typescript
const result = await signIn(email, password);
if (result.success && result.user) {
  // User authenticated
}
```

### Password Reset
```typescript
const result = await resetPassword(email);
if (result.success) {
  // Reset email sent
}
```

### Authenticated Requests
```typescript
const response = await authFetch('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

## Security Features

- Secure session storage using Expo SecureStore
- Automatic token refresh
- Email validation (RFC compliant)
- Password strength requirements (8+ chars, 1+ digit)
- Protected routes with authentication guards
- CSRF protection via Supabase

## Deployment

The app supports deployment to:
- Expo Go (development)
- Expo Application Services (EAS)
- Web (static export)
- iOS App Store
- Google Play Store

## License

MIT