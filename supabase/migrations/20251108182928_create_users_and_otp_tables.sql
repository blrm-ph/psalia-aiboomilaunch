/*
  # Create Users and OTP Tables

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - Unique identifier for each user
      - `email` (text, unique) - User's email address
      - `created_at` (timestamptz) - When the user first signed up
      - `last_login` (timestamptz) - Last time the user logged in

    - `otp_codes`
      - `id` (uuid, primary key) - Unique identifier for each OTP
      - `email` (text) - Email address for which OTP is generated
      - `otp_code` (text) - The 6-digit OTP code
      - `created_at` (timestamptz) - When the OTP was created
      - `expires_at` (timestamptz) - When the OTP expires
      - `verified` (boolean) - Whether the OTP has been verified
      - `verified_at` (timestamptz) - When the OTP was verified

  2. Security
    - Enable RLS on both tables
    - Add policies for anonymous users to interact with authentication

  3. Indexes
    - Add index on email for fast lookups
    - Add index on otp_codes email and verified status
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  verified_at timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email_verified ON otp_codes(email, verified);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Anyone can read users"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert users"
  ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update users"
  ON users
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for otp_codes table
CREATE POLICY "Anyone can read their OTP codes"
  ON otp_codes
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert OTP codes"
  ON otp_codes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update OTP codes"
  ON otp_codes
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
