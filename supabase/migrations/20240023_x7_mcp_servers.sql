-- create x7_mcp_servers table
CREATE TABLE IF NOT EXISTS public.x7_mcp_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('stdio', 'sse')),
    command TEXT NOT NULL,
    args TEXT[] DEFAULT '{}',
    env JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- set up RLS
ALTER TABLE public.x7_mcp_servers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own MCP servers"
    ON public.x7_mcp_servers
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.x7_mcp_servers ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE TRIGGER set_x7_mcp_servers_updated_at
BEFORE UPDATE ON public.x7_mcp_servers
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();
