-- Add policy for admins to manage learning_paths (insert, update, delete for any user)
CREATE POLICY "Admins can insert learning paths for any user"
ON public.learning_paths
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update learning paths for any user"
ON public.learning_paths
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all learning paths"
ON public.learning_paths
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));