-- Create function to check if user is a dev user (for fast lookups)
CREATE OR REPLACE FUNCTION public.is_dev_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'dev'
  )
$$;