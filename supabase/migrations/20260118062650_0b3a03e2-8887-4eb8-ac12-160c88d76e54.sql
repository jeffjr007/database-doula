-- Add column to track stage 2 unlock status
ALTER TABLE public.profiles 
ADD COLUMN stage2_unlocked boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.stage2_unlocked IS 'Controls if mentee can access Stage 2, unlocked by mentor after LinkedIn validation';