-- Add learning_path column to profiles table for storing personalized development path
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS learning_path TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.learning_path IS 'Trilha personalizada de desenvolvimento criada pelo mentor para o mentorado';