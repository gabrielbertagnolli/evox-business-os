-- Core schema for Evox Business OS

-- Integrations: stores OAuth tokens per user per provider
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null, -- 'meta', 'google', 'hubspot', 'slack', 'linkedin'
  provider_account_id text,
  provider_account_name text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[],
  meta jsonb default '{}',
  connected_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

alter table public.integrations enable row level security;
create policy "Users manage own integrations" on public.integrations
  for all using (auth.uid() = user_id);

-- Agents
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'inactive', -- 'active', 'inactive', 'error'
  trigger_type text default 'manual', -- 'manual', 'schedule', 'webhook'
  trigger_config jsonb default '{}',
  integrations text[] default '{}',
  last_run_at timestamptz,
  run_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.agents enable row level security;
create policy "Users manage own agents" on public.agents
  for all using (auth.uid() = user_id);

-- Workflows
create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'draft', -- 'draft', 'active', 'paused'
  steps jsonb default '[]',
  integrations text[] default '{}',
  last_run_at timestamptz,
  run_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.workflows enable row level security;
create policy "Users manage own workflows" on public.workflows
  for all using (auth.uid() = user_id);

-- Agent/workflow run logs
create table if not exists public.run_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null, -- 'agent', 'workflow'
  source_id uuid not null,
  source_name text,
  status text not null, -- 'success', 'error', 'running'
  output text,
  error text,
  started_at timestamptz default now(),
  finished_at timestamptz
);

alter table public.run_logs enable row level security;
create policy "Users view own run logs" on public.run_logs
  for all using (auth.uid() = user_id);
