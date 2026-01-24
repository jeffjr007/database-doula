-- Add personal data fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS age text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS linkedin_url text;