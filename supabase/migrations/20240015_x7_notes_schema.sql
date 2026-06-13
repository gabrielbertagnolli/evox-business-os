CREATE TABLE public.x7_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    tags TEXT[] DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.x7_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notes" 
    ON public.x7_notes 
    FOR ALL 
    USING (auth.uid() = user_id);

-- Automatically update updated_at
CREATE TRIGGER handle_updated_at_x7_notes
    BEFORE UPDATE ON public.x7_notes
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime('updated_at');
