-- Phase 22: Add GPT-like features to x7_agents (context files, skills array)

ALTER TABLE public.x7_agents 
ADD COLUMN IF NOT EXISTS knowledge_files jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.x7_agents 
ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.x7_agents 
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Recordar ejecutar las migraciones en Supabase para aplicar estos cambios.
