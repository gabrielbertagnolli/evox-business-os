-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Open-WebUI File Schema Port
CREATE TABLE IF NOT EXISTS public.x7_file (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hash TEXT,
    filename TEXT,
    path TEXT,
    data JSONB,
    meta JSONB,
    created_at BIGINT,
    updated_at BIGINT
);

-- Open-WebUI Knowledge Schema Port
CREATE TABLE IF NOT EXISTS public.x7_knowledge (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    description TEXT,
    meta JSONB,
    created_at BIGINT,
    updated_at BIGINT
);

CREATE TABLE IF NOT EXISTS public.x7_knowledge_directory (
    id TEXT PRIMARY KEY,
    knowledge_id TEXT NOT NULL REFERENCES public.x7_knowledge(id) ON DELETE CASCADE,
    parent_id TEXT REFERENCES public.x7_knowledge_directory(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at BIGINT,
    updated_at BIGINT,
    UNIQUE(knowledge_id, parent_id, name)
);

CREATE TABLE IF NOT EXISTS public.x7_knowledge_file (
    id TEXT PRIMARY KEY,
    knowledge_id TEXT NOT NULL REFERENCES public.x7_knowledge(id) ON DELETE CASCADE,
    file_id TEXT NOT NULL REFERENCES public.x7_file(id) ON DELETE CASCADE,
    directory_id TEXT REFERENCES public.x7_knowledge_directory(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at BIGINT,
    updated_at BIGINT,
    UNIQUE(knowledge_id, file_id)
);

-- Document Chunks for Vector Search (RAG)
CREATE TABLE IF NOT EXISTS public.x7_document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id TEXT NOT NULL REFERENCES public.x7_file(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    metadata JSONB,
    embedding vector(1536) -- Default for text-embedding-3-small/ada-002
);

-- Enable RLS
ALTER TABLE public.x7_file ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x7_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x7_knowledge_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x7_knowledge_file ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x7_document_chunks ENABLE ROW LEVEL SECURITY;

-- Standard Policies
CREATE POLICY "Users can manage their files" ON public.x7_file FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their knowledge" ON public.x7_knowledge FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their knowledge dirs" ON public.x7_knowledge_directory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their knowledge files" ON public.x7_knowledge_file FOR ALL USING (auth.uid() = user_id);

-- Document chunks RLS through file ownership
CREATE POLICY "Users can manage chunks of their files" ON public.x7_document_chunks FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.x7_file
        WHERE x7_file.id = x7_document_chunks.file_id
        AND x7_file.user_id = auth.uid()
    )
);

-- Vector similarity search function
CREATE OR REPLACE FUNCTION match_x7_document_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_file_ids text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  file_id text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    x7_document_chunks.id,
    x7_document_chunks.file_id,
    x7_document_chunks.content,
    x7_document_chunks.metadata,
    1 - (x7_document_chunks.embedding <=> query_embedding) AS similarity
  FROM x7_document_chunks
  WHERE 1 - (x7_document_chunks.embedding <=> query_embedding) > match_threshold
    AND (filter_file_ids IS NULL OR x7_document_chunks.file_id = ANY(filter_file_ids))
  ORDER BY x7_document_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;
