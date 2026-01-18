-- Projeto: Perfil Glorioso / GloriousCV
-- Data: 2026-01-18
-- ============================================

-- PASSO 1: Criar o tipo ENUM
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- PASSO 2: Criar as tabelas
-- ============================================

-- Tabela: profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  platform_activated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: user_roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Tabela: invite_codes
CREATE TABLE public.invite_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  mentee_name TEXT,
  mentee_email TEXT,
  used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID,
  used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: linkedin_diagnostics
CREATE TABLE public.linkedin_diagnostics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Diagnóstico LinkedIn',
  notes TEXT,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: opportunity_funnels
CREATE TABLE public.opportunity_funnels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Funil de Oportunidades',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  pdf_url TEXT,
  attachments TEXT[] DEFAULT '{}'::text[],
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: saved_cvs
CREATE TABLE public.saved_cvs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  cv_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: chat_messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stage_number INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: mentoring_progress
CREATE TABLE public.mentoring_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stage_number INTEGER NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 1,
  completed BOOLEAN NOT NULL DEFAULT false,
  stage_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: collected_data
CREATE TABLE public.collected_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data_type TEXT NOT NULL,
  data_content JSONB NOT NULL,
  stage_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- PASSO 3: Criar funções auxiliares
-- ============================================

-- Função: has_role (para evitar recursão infinita em RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função: handle_new_user (trigger para criar profile automaticamente)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Função: update_updated_at_column (atualizar timestamp automaticamente)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- PASSO 4: Criar triggers
-- ============================================

-- Trigger para criar profile quando usuário se cadastra
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PASSO 5: Habilitar RLS em todas as tabelas
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentoring_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collected_data ENABLE ROW LEVEL SECURITY;

-- PASSO 6: Criar políticas RLS
-- ============================================

-- PROFILES
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- USER_ROLES
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- INVITE_CODES
CREATE POLICY "Anyone can validate codes for signup" ON public.invite_codes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage invite codes" ON public.invite_codes
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- LINKEDIN_DIAGNOSTICS
CREATE POLICY "Users can view their own published diagnostic" ON public.linkedin_diagnostics
  FOR SELECT USING ((auth.uid() = user_id) AND (status = 'published'));

CREATE POLICY "Admins can manage all diagnostics" ON public.linkedin_diagnostics
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- OPPORTUNITY_FUNNELS
CREATE POLICY "Users can view their own published funnel" ON public.opportunity_funnels
  FOR SELECT USING ((auth.uid() = user_id) AND (status = 'published'));

CREATE POLICY "Admins can manage all funnels" ON public.opportunity_funnels
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- SAVED_CVS
CREATE POLICY "Users can view their own CVs" ON public.saved_cvs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own CVs" ON public.saved_cvs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CVs" ON public.saved_cvs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own CVs" ON public.saved_cvs
  FOR DELETE USING (auth.uid() = user_id);

-- CHAT_MESSAGES
CREATE POLICY "Users can view their own messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- MENTORING_PROGRESS
CREATE POLICY "Users can view their own progress" ON public.mentoring_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON public.mentoring_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.mentoring_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress" ON public.mentoring_progress
  FOR DELETE USING (auth.uid() = user_id);

-- COLLECTED_DATA
CREATE POLICY "Users can view their own data" ON public.collected_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own data" ON public.collected_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data" ON public.collected_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data" ON public.collected_data
  FOR DELETE USING (auth.uid() = user_id);

-- PASSO 7: Criar bucket de storage
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('mentee-files', 'mentee-files', true);

-- Políticas de storage
CREATE POLICY "Anyone can view mentee files" ON storage.objects
  FOR SELECT USING (bucket_id = 'mentee-files');

CREATE POLICY "Authenticated users can upload mentee files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'mentee-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own mentee files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'mentee-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own mentee files" ON storage.objects
  FOR DELETE USING (bucket_id = 'mentee-files' AND auth.uid()::text = (storage.foldername(name))[1]);