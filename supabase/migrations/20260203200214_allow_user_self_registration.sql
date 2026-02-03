/*
  # Allow User Self-Registration

  1. Problem
    - New users can't insert their own record in users table during signup
    - Only admins can insert, but new users aren't admins yet

  2. Solution
    - Add policy allowing authenticated users to insert their own record
    - Check that the ID matches auth.uid()

  3. Security
    - Users can only insert records with their own ID
    - Prevents users from creating records for others
*/

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
