-- Phase 38: Channel Messages Table

create table if not exists public.x7_channel_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id text not null references public.x7_channels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  role text not null default 'user', -- 'user', 'assistant', 'system'
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.x7_channel_messages enable row level security;

-- Users can read messages in channels they are members of
create policy "Users can read channel messages if member" on public.x7_channel_messages
  for select using (
    exists (
      select 1 from public.x7_channel_members
      where x7_channel_members.channel_id = x7_channel_messages.channel_id
      and x7_channel_members.user_id = auth.uid()
    ) OR
    exists (
      select 1 from public.x7_channels
      where x7_channels.id = x7_channel_messages.channel_id
      and x7_channels.user_id = auth.uid()
    )
  );

-- Users can insert their own messages into channels they are members of
create policy "Users can insert messages into member channels" on public.x7_channel_messages
  for insert with check (
    auth.uid() = user_id AND (
      exists (
        select 1 from public.x7_channel_members
        where x7_channel_members.channel_id = x7_channel_messages.channel_id
        and x7_channel_members.user_id = auth.uid()
      ) OR
      exists (
        select 1 from public.x7_channels
        where x7_channels.id = x7_channel_messages.channel_id
        and x7_channels.user_id = auth.uid()
      )
    )
  );

create index if not exists idx_x7_cm_channel_id on public.x7_channel_messages(channel_id);
create index if not exists idx_x7_cm_created_at on public.x7_channel_messages(created_at);
