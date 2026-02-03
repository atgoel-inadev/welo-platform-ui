/*
  # Fix JWT Role Path in RLS Policies

  1. Problem
    - RLS policies check `auth.jwt() ->> 'role'` which doesn't exist
    - Role is stored in user_metadata, not at root level
    - Correct path is `auth.jwt() -> 'user_metadata' ->> 'role'`

  2. Solution
    - Update all policies to use correct JWT path
    - Ensure users can read their own data regardless of role

  3. Security
    - Maintains security model
    - All authenticated users can read own profile
    - Admins can read/write all profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Users can always view and update their own profile
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

-- Admins can view all users (using correct JWT path)
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'ADMIN')
    OR
    (auth.uid() = id)
  );

-- Admins can update all users (using correct JWT path)
CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'ADMIN')
    OR
    (auth.uid() = id)
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'ADMIN')
    OR
    (auth.uid() = id)
  );

-- Admins can insert users (using correct JWT path)
CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'ADMIN'
  );
