-- Remove the overly permissive public SELECT policy from invite_codes
DROP POLICY IF EXISTS "Anyone can validate codes for signup" ON public.invite_codes;

-- Add DELETE policy for learning_paths (was missing, needed for admin cleanup)
CREATE POLICY "Admins can delete learning paths"
ON public.learning_paths
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);