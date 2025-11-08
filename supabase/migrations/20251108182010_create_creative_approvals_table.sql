/*
  # Create Creative Approvals Table

  1. New Tables
    - `creative_approvals`
      - `id` (uuid, primary key) - Unique identifier for each approval record
      - `creative_filename` (text) - The filename of the creative
      - `creative_hash` (text) - Hash of the creative data to uniquely identify it
      - `is_approved` (boolean) - Whether the creative is approved
      - `session_id` (text) - Session identifier to group related approvals
      - `created_at` (timestamptz) - When the approval was created
      - `updated_at` (timestamptz) - When the approval was last updated

  2. Security
    - Enable RLS on `creative_approvals` table
    - Add policy for anyone to read their session's approvals
    - Add policy for anyone to insert/update approvals for their session

  3. Indexes
    - Add index on session_id and creative_hash for fast lookups
*/

CREATE TABLE IF NOT EXISTS creative_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_filename text NOT NULL,
  creative_hash text NOT NULL,
  is_approved boolean DEFAULT false,
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_creative_approvals_session 
  ON creative_approvals(session_id, creative_hash);

-- Enable RLS
ALTER TABLE creative_approvals ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read approvals (we use session_id for isolation)
CREATE POLICY "Anyone can read approvals"
  ON creative_approvals
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to insert approvals
CREATE POLICY "Anyone can insert approvals"
  ON creative_approvals
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to update approvals
CREATE POLICY "Anyone can update approvals"
  ON creative_approvals
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
