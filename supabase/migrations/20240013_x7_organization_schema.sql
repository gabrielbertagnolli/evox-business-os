-- Phase 11: Prompts, Folders, and Tags

-- Folders
create table if not exists public.x7_folders (
  id text primary key,
  parent_id text references public.x7_folders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  meta jsonb default '{}'::jsonb,
  is_expanded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.x7_folders enable row level security;
create policy "Users manage own folders" on public.x7_folders
  for all using (auth.uid() = user_id);

-- Prompts (Slash commands)
create table if not exists public.x7_prompts (
  command text primary key, -- e.g., 'experto'
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  access_control jsonb default null, -- RBAC access
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.x7_prompts enable row level security;
create policy "Users manage own prompts" on public.x7_prompts
  for all using (auth.uid() = user_id);

-- Tags
create table if not exists public.x7_tags (
  id text primary key,
  name text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.x7_tags enable row level security;
create policy "Users manage own tags" on public.x7_tags
  for all using (auth.uid() = user_id);

-- Chat Tags (Many-to-Many relation)
create table if not exists public.x7_chat_tags (
  id text primary key default gen_random_uuid()::text,
  chat_id text not null references public.x7_chats(id) on delete cascade,
  tag_id text not null references public.x7_tags(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(chat_id, tag_id)
);

alter table public.x7_chat_tags enable row level security;
create policy "Users manage own chat tags" on public.x7_chat_tags
  for all using (auth.uid() = user_id);
