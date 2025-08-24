/*
  # Add OAuth provider columns to users table

  1. Changes
    - Add google_id column for Google OAuth integration
    - Add apple_id column for Apple OAuth integration
    - Both columns are optional and indexed for performance

  2. Security
    - No RLS changes needed as existing policies will apply
*/

-- Add Google OAuth ID column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'google_id'
  ) THEN
    ALTER TABLE users ADD COLUMN google_id text;
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
  END IF;
END $$;

-- Add Apple OAuth ID column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'apple_id'
  ) THEN
    ALTER TABLE users ADD COLUMN apple_id text;
    CREATE INDEX IF NOT EXISTS idx_users_apple_id ON users(apple_id);
  END IF;
END $$;