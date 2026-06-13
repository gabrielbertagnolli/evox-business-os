-- Phase 9: "Functions" (Middlewares, Valves, Pipes, Actions)

create table if not exists public.x7_functions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null, -- 'filter', 'action', 'pipe'
  content text not null, -- JavaScript Code that runs in Sandbox
  meta jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.x7_functions enable row level security;
create policy "Users manage own x7_functions" on public.x7_functions
  for all using (auth.uid() = user_id);

create index if not exists idx_x7_functions_user_id on public.x7_functions(user_id);
create index if not exists idx_x7_functions_type on public.x7_functions(type);
