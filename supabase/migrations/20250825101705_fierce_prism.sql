/*
  # Finalize Email Authentication Schema

  1. Ensure users table has correct structure
  2. Add indexes for email lookups
  3. Create auth_attempts table for rate limiting
*/

-- Ensure users table has the correct structure
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  password_hash text,
  google_id text UNIQUE,
  apple_id text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(lower(email));
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_apple_id ON public.users(apple_id);

-- Create auth_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS public.auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  email text NOT NULL,
  attempt_type text NOT NULL, -- 'login' or 'register'
  success boolean DEFAULT false,
  attempted_at timestamptz DEFAULT now()
);

-- Index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_auth_attempts_lookup 
ON public.auth_attempts(ip_address, email, attempt_type, attempted_at);

-- Cleanup function for old auth attempts (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_auth_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.auth_attempts 
  WHERE attempted_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql;