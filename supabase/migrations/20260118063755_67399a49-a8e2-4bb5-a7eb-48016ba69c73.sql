-- Add stage2_completed column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN stage2_completed boolean DEFAULT false;

-- Add policy to allow admins to update all profiles (for stage unlock)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));