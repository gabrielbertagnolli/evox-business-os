-- Create table for X7 User Settings (LLM Providers and BYOK)

CREATE TABLE IF NOT EXISTS public.x7_user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    active_provider TEXT NOT NULL DEFAULT 'openai',
    active_model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    openai_api_key TEXT,
    anthropic_api_key TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.x7_user_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own x7 settings"
    ON public.x7_user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own x7 settings"
    ON public.x7_user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own x7 settings"
    ON public.x7_user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_x7_user_settings_updated_at
    BEFORE UPDATE ON public.x7_user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
