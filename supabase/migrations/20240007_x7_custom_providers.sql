-- Table for Custom LLM Providers (Universal Gateway)

CREATE TABLE IF NOT EXISTS public.x7_llm_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    api_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.x7_llm_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom providers"
    ON public.x7_llm_providers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom providers"
    ON public.x7_llm_providers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom providers"
    ON public.x7_llm_providers FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom providers"
    ON public.x7_llm_providers FOR DELETE
    USING (auth.uid() = user_id);

-- Alter user settings to reference a custom provider
ALTER TABLE public.x7_user_settings
ADD COLUMN IF NOT EXISTS custom_provider_id UUID REFERENCES public.x7_llm_providers(id) ON DELETE SET NULL;
