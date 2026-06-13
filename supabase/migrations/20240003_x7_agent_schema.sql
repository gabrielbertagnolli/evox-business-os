-- Phase 3: X7 Agent Memory & Skills (Hermes Clone)

-- 1. X7 Skills
-- Almacena las habilidades autónomas o preconfiguradas que X7 puede ejecutar
create table if not exists public.x7_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  code_payload text, -- The function definition or script payload
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, name)
);

alter table public.x7_skills enable row level security;
create policy "Users manage own x7 skills" on public.x7_skills
  for all using (auth.uid() = user_id);

-- 2. X7 Memory Nodes
-- Actúa como el Long-Term Context para retener preferencias, reglas y hechos
create table if not exists public.x7_memory_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  type text not null, -- 'rule', 'fact', 'preference'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.x7_memory_nodes enable row level security;
create policy "Users manage own x7 memory" on public.x7_memory_nodes
  for all using (auth.uid() = user_id);
