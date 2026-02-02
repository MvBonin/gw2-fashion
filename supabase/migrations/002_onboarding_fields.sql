-- Phase 2: Onboarding Wizard Fields
-- Add fields for GW2 API integration and onboarding completion tracking

-- Add new columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS gw2_api_key TEXT,
  ADD COLUMN IF NOT EXISTS gw2_account_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS gw2_account_name_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS username_manually_set BOOLEAN DEFAULT false;

-- Create case-insensitive unique index for username
-- This ensures usernames are unique regardless of case (e.g., "Pfui" and "pfui" are treated as the same)
-- But the actual username is stored with the original case
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users(LOWER(username));

-- Function to check if username exists (case-insensitive)
CREATE OR REPLACE FUNCTION public.username_exists(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users WHERE LOWER(username) = LOWER(check_username)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update handle_new_user() function to set username_manually_set = false for auto-generated usernames
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, discord_id, username, avatar_url, username_manually_set)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'provider_id',
    COALESCE(
      NEW.raw_user_meta_data->>'preferred_username',
      NEW.raw_user_meta_data->>'name',
      'user_' || substr(NEW.id::text, 1, 8)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

