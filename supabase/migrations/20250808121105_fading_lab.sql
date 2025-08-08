/*
  # Create orders table

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users table)
      - `telegram_id` (text, for linking to telegram users)
      - `usdc_amount` (numeric, amount in USDC)
      - `eur_amount` (numeric, amount in EUR)
      - `direction` (text, 'usdc-eur' or 'eur-usdc')
      - `exchange_rate` (text, rate at time of order)
      - `fee_percentage` (numeric, fee percentage)
      - `status` (text, order status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `orders` table
    - Add policy for users to read their own orders
    - Add policy for users to create their own orders
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  telegram_id text,
  usdc_amount numeric(15,2) NOT NULL,
  eur_amount numeric(15,2) NOT NULL,
  direction text NOT NULL CHECK (direction IN ('usdc-eur', 'eur-usdc')),
  exchange_rate text NOT NULL,
  fee_percentage numeric(5,2) DEFAULT 0.5,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text OR auth.uid()::text = telegram_id);

CREATE POLICY "Users can create own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text OR auth.uid()::text = telegram_id);

CREATE POLICY "Allow anonymous access for orders"
  ON orders
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_telegram_id ON orders(telegram_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);