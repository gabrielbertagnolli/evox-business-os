-- Phase 8: Chat persistence and Tree-based Messages (Forking)

create table if not exists public.x7_chats (
  id text primary key, -- Text because OpenWebUI uses UUID strings or custom ids
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New Chat',
  model_id text,
  system_prompt text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  folder_id text,
  share_id text unique,
  archived boolean default false,
  pinned boolean default false,
  meta jsonb default '{}'::jsonb
);

alter table public.x7_chats enable row level security;
create policy "Users manage own x7_chats" on public.x7_chats
  for all using (auth.uid() = user_id);

-- Chat Messages (Tree Structure for Forking)
create table if not exists public.x7_messages (
  id text primary key,
  chat_id text not null references public.x7_chats(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id text references public.x7_messages(id) on delete set null,
  role text not null, -- 'user', 'assistant', 'system'
  content text not null,
  model text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  meta jsonb default '{}'::jsonb
);

alter table public.x7_messages enable row level security;
create policy "Users manage own x7_messages" on public.x7_messages
  for all using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_x7_chats_user_id on public.x7_chats(user_id);
create index if not exists idx_x7_chats_archived on public.x7_chats(archived);
create index if not exists idx_x7_messages_chat_id on public.x7_messages(chat_id);
create index if not exists idx_x7_messages_parent_id on public.x7_messages(parent_id);
