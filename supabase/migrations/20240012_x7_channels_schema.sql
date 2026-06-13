-- Phase 10: Collaborative Channels and RBAC (Role-Based Access Control)

-- Groups
create table if not exists public.x7_groups (
  id text primary key,
  name text not null,
  description text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Access Grants (SCIM-like RBAC)
create table if not exists public.x7_access_grants (
  id text primary key,
  resource_type text not null, -- e.g., 'channel', 'knowledge', 'agent'
  resource_id text not null,
  grant_type text not null, -- 'user', 'group'
  grant_id text not null, -- user_id or group_id
  permission text not null, -- 'read', 'write', 'admin'
  created_at timestamptz default now()
);

-- Channels (Groups / DMs)
create table if not exists public.x7_channels (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text, -- 'group', 'dm'
  name text not null,
  description text,
  is_private boolean default false,
  data jsonb default '{}'::jsonb,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  archived_at timestamptz,
  deleted_at timestamptz
);

alter table public.x7_channels enable row level security;
create policy "Users can read granted channels" on public.x7_channels
  for select using (
    auth.uid() = user_id OR
    exists (
      select 1 from public.x7_access_grants ag 
      where ag.resource_type = 'channel' 
      and ag.resource_id = x7_channels.id 
      and ag.grant_type = 'user' 
      and ag.grant_id = auth.uid()::text
    )
  );

create policy "Users manage own channels" on public.x7_channels
  for all using (auth.uid() = user_id);

-- Channel Members
create table if not exists public.x7_channel_members (
  id text primary key,
  channel_id text not null references public.x7_channels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text default 'member', -- 'manager', 'member'
  status text default 'joined',
  is_active boolean default true,
  is_channel_muted boolean default false,
  is_channel_pinned boolean default false,
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz default now(),
  last_read_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.x7_channel_members enable row level security;
create policy "Users manage own memberships" on public.x7_channel_members
  for all using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_x7_ag_resource on public.x7_access_grants(resource_type, resource_id);
create index if not exists idx_x7_cm_channel_user on public.x7_channel_members(channel_id, user_id);
