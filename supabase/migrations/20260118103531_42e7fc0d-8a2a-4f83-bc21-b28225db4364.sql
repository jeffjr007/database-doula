-- Add word_url column to linkedin_diagnostics for Stage 1
ALTER TABLE public.linkedin_diagnostics 
ADD COLUMN IF NOT EXISTS word_url text;

-- Add word_url column to opportunity_funnels for Stage 3
ALTER TABLE public.opportunity_funnels 
ADD COLUMN IF NOT EXISTS word_url text;