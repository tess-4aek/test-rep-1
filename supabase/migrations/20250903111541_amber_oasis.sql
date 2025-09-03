/*
  # Add OTP fields to auth_attempts table

  1. New Columns
    - `otp_code` (text): Stores the 6-digit verification code
    - `otp_expires_at` (timestamp): When the OTP code expires
    - `otp_used` (boolean): Whether the OTP has been used

  2. Security
    - Enable RLS on `auth_attempts` table (if not already enabled)
    - Add policy for service role access

  3. Indexes
    - Add index for efficient OTP lookups by email and expiration
*/

-- Add OTP-related columns to auth_attempts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'auth_attempts' AND column_name = 'otp_code'
  ) THEN
    ALTER TABLE auth_attempts ADD COLUMN otp_code text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'auth_attempts' AND column_name = 'otp_expires_at'
  ) THEN
    ALTER TABLE auth_attempts ADD COLUMN otp_expires_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'auth_attempts' AND column_name = 'otp_used'
  ) THEN
    ALTER TABLE auth_attempts ADD COLUMN otp_used boolean DEFAULT false;
  END IF;
END $$;

-- Add index for efficient OTP lookups
CREATE INDEX IF NOT EXISTS idx_auth_attempts_otp_lookup 
ON auth_attempts (email, attempt_type, otp_expires_at, otp_used) 
WHERE otp_code IS NOT NULL;

-- Enable RLS if not already enabled
ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;

-- Add policy for service role access (Edge Functions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'auth_attempts' AND policyname = 'Service role can manage auth attempts'
  ) THEN
    CREATE POLICY "Service role can manage auth attempts"
      ON auth_attempts
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;