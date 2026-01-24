-- Create table for interview history
CREATE TABLE public.interview_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT,
  data_content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.interview_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own interview history" 
ON public.interview_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interview history" 
ON public.interview_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview history" 
ON public.interview_history 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interview history" 
ON public.interview_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_interview_history_updated_at
BEFORE UPDATE ON public.interview_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();