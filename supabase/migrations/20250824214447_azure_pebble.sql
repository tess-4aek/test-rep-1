/*
  # Create users table with OAuth support

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `google_id` (text, unique)
      - `apple_id` (text, unique)
      - `created_at` (timestamptz)

  2. Security
    - Add indexes for OAuth provider lookups
*/

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  name text,
  google_id text UNIQUE,
  apple_id text UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_apple_id ON public.users(apple_id);