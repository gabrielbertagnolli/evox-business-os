-- create x7_tasks table
CREATE TABLE IF NOT EXISTS public.x7_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.x7_agents(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'error')),
    goal TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    result TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- set up RLS
ALTER TABLE public.x7_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own x7 tasks"
    ON public.x7_tasks
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_x7_tasks_updated_at
BEFORE UPDATE ON public.x7_tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();
