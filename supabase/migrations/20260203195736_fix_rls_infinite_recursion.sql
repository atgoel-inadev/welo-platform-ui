/*
  # Fix RLS Infinite Recursion

  1. Problem
    - Current admin policies query the users table to check role
    - This causes infinite recursion when updating users table
    - Need to check role from auth.jwt() user_metadata instead

  2. Solution
    - Drop existing admin policies
    - Create new policies that check auth.jwt() metadata
    - This avoids querying users table during policy evaluation

  3. Security
    - Maintains same security model
    - Admins can still manage all users
    - Users can still manage own profile
    - Role is stored in user_metadata during signup
*/

-- Drop policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;

-- Recreate admin policies using auth.jwt() to avoid recursion
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'ADMIN')
    OR
    (auth.uid() = id)
  );

CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'ADMIN')
    OR
    (auth.uid() = id)
  )
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'ADMIN')
    OR
    (auth.uid() = id)
  );

CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' = 'ADMIN'
  );

-- Update existing policies to remove recursion
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Note: These are now redundant since the admin policies already include "OR auth.uid() = id"
-- but keeping them for clarity
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
