# CryptoExchange App

A React Native Expo app for cryptocurrency exchange with Supabase authentication.

## Setup

### Prerequisites

- Node.js 18+ 
- Expo CLI
- Supabase account

### Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

## Authentication

This app uses Supabase Auth with email/password authentication.

### Auth Flows

- **Sign Up**: Users create an account with email/password
- **Sign In**: Users authenticate with their credentials  
- **Forgot Password**: Users can request a password reset email
- **Reset Password**: Users can set a new password via magic link
- **Sign Out**: Clears session and redirects to sign in

### Session Management

- Sessions are automatically managed by Supabase
- Access tokens are stored securely using Expo SecureStore
- Sessions are automatically refreshed when needed
- Protected routes require authentication

### Making Authenticated Requests

Use the helper functions from `lib/supabase.ts`:

```typescript
import { authenticatedFetch, getAuthHeaders } from '@/lib/supabase';

// Option 1: Use the helper function
const response = await authenticatedFetch('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data),
});

// Option 2: Get headers manually
const headers = await getAuthHeaders();
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers,
  body: JSON.stringify(data),
});
```

## Project Structure

```
app/
├── auth/                 # Authentication screens
│   ├── sign-in.tsx      # Sign in screen
│   ├── sign-up.tsx      # Sign up screen
│   ├── forgot-password.tsx
│   └── reset-password.tsx
├── (tabs)/              # Main app tabs (protected)
│   ├── index.tsx        # Home screen
│   ├── history.tsx      # Transaction history
│   └── profile.tsx      # User profile
├── index.tsx            # Auth gate/splash screen
└── _layout.tsx          # Root layout with AuthProvider

contexts/
└── AuthContext.tsx      # Global auth state management

components/
└── ProtectedRoute.tsx   # Route guard component

lib/
└── supabase.ts         # Supabase client and helpers

utils/
└── validation.ts       # Form validation utilities
```

## Features

- ✅ Email/password authentication
- ✅ Session persistence and auto-refresh
- ✅ Protected routes
- ✅ Form validation
- ✅ Error handling
- ✅ Password reset flow
- ✅ Responsive design
- ✅ TypeScript support