-- Add email column to profiles table to store user email for admin visibility
ALTER TABLE public.profiles 
ADD COLUMN email TEXT DEFAULT NULL;

-- Update existing profiles with email from auth.users (this runs once on migration)
-- Note: This is done via trigger for new users, but we need to backfill existing ones
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;

-- Update the handle_new_user trigger to also capture email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.email
  );
  RETURN new;
END;
$function$;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.email IS 'Email do usuário sincronizado de auth.users para visibilidade do admin';