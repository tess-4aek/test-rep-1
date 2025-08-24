/*
  # Add password authentication support

  1. Schema Changes
    - Add `password_hash` column to users table for email/password authentication
    - Add email index for efficient lookups
    - Add rate limiting table for auth attempts

  2. Security
    - Password hash stored securely (bcrypt)
    - Email index for case-insensitive lookups
    - Rate limiting infrastructure
*/

-- Add password hash column for email/password users
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS password_hash text;

-- Add case-insensitive email index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(lower(email));

-- Create rate limiting table for auth attempts
CREATE TABLE IF NOT EXISTS public.auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  email text,
  attempt_type text NOT NULL, -- 'login' or 'register'
  attempted_at timestamptz DEFAULT now(),
  success boolean DEFAULT false
);

-- Index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip_time 
  ON public.auth_attempts(ip_address, attempted_at);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_email_time 
  ON public.auth_attempts(lower(email), attempted_at);

-- Clean up old attempts (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_auth_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.auth_attempts 
  WHERE attempted_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql;