-- Phase 2: Credits and Usage Tracking

-- 1. User Profiles (Tenants)
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  credit_balance_usd numeric(12, 4) not null default 0.0000,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_profiles enable row level security;
create policy "Users view own profile" on public.user_profiles
  for select using (auth.uid() = user_id);

-- Trigger to create a user_profile automatically when a new user signs up
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.user_profiles (user_id, credit_balance_usd)
  values (new.id, 1.0000); -- Give $1.00 free credit to new users
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists
drop trigger if exists on_auth_user_created on auth.users;

-- Recreate trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Usage Records
create table if not exists public.usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workflow_id uuid references public.workflows(id) on delete set null,
  agent_id uuid references public.agents(id) on delete set null,
  provider text not null, -- 'openai', 'anthropic', etc.
  model_used text not null,
  prompt_tokens int not null,
  completion_tokens int not null,
  total_tokens int not null,
  cost_per_token_input numeric(12, 8) not null,
  cost_per_token_output numeric(12, 8) not null,
  actual_cost_usd numeric(12, 6) not null,
  credit_price_usd numeric(12, 6) not null, -- usually actual_cost_usd * 1.30
  timestamp timestamptz default now()
);

alter table public.usage_records enable row level security;
create policy "Users view own usage records" on public.usage_records
  for select using (auth.uid() = user_id);

-- 3. Atomic Credit Debit Function
create or replace function public.debit_credits(
  p_user_id uuid,
  p_workflow_id uuid,
  p_agent_id uuid,
  p_provider text,
  p_model_used text,
  p_prompt_tokens int,
  p_completion_tokens int,
  p_cost_per_token_input numeric,
  p_cost_per_token_output numeric,
  p_margin_multiplier numeric default 1.30
) returns jsonb as $$
declare
  v_actual_cost numeric;
  v_credit_price numeric;
  v_current_balance numeric;
  v_new_balance numeric;
  v_record_id uuid;
begin
  -- Calculate costs
  v_actual_cost := (p_prompt_tokens * p_cost_per_token_input) + (p_completion_tokens * p_cost_per_token_output);
  v_credit_price := v_actual_cost * p_margin_multiplier;

  -- Lock the row for update to ensure atomicity
  select credit_balance_usd into v_current_balance 
  from public.user_profiles 
  where user_id = p_user_id 
  for update;

  if not found then
    raise exception 'User profile not found';
  end if;

  if v_current_balance < v_credit_price then
    raise exception 'Insufficient credits';
  end if;

  v_new_balance := v_current_balance - v_credit_price;

  -- Deduct balance
  update public.user_profiles
  set credit_balance_usd = v_new_balance, updated_at = now()
  where user_id = p_user_id;

  -- Insert usage record
  insert into public.usage_records (
    user_id, workflow_id, agent_id, provider, model_used, 
    prompt_tokens, completion_tokens, total_tokens, 
    cost_per_token_input, cost_per_token_output, 
    actual_cost_usd, credit_price_usd
  ) values (
    p_user_id, p_workflow_id, p_agent_id, p_provider, p_model_used,
    p_prompt_tokens, p_completion_tokens, (p_prompt_tokens + p_completion_tokens),
    p_cost_per_token_input, p_cost_per_token_output,
    v_actual_cost, v_credit_price
  ) returning id into v_record_id;

  return json_build_object(
    'success', true,
    'record_id', v_record_id,
    'debited_amount', v_credit_price,
    'remaining_balance', v_new_balance
  );
end;
$$ language plpgsql security definer;
