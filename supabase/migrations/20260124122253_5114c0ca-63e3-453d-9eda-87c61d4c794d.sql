-- Add 'dev' role to app_role enum for dev users
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dev';