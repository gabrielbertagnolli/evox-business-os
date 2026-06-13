-- Phase 20: X7 Agents Schema

create table if not exists public.x7_agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  system_prompt text not null,
  provider text not null default 'openai',
  model text not null default 'gpt-4o-mini',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.x7_agents enable row level security;
create policy "Users manage own x7_agents" on public.x7_agents
  for all using (auth.uid() = user_id);

-- Performance index
create index if not exists idx_x7_agents_user_id on public.x7_agents(user_id);
