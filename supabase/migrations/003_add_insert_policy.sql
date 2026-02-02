-- Phase 3: Add INSERT policy for users table
-- Allow users to insert their own profile (in case trigger didn't fire)

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

