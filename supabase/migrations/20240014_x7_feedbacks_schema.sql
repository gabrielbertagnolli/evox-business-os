-- Phase 12: Evaluations, Feedbacks and RLHF

create table if not exists public.x7_feedbacks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  chat_id text not null references public.x7_chats(id) on delete cascade,
  message_id text not null references public.x7_messages(id) on delete cascade,
  rating integer not null, -- 1 for upvote, -1 for downvote
  comment text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.x7_feedbacks enable row level security;
create policy "Users manage own feedbacks" on public.x7_feedbacks
  for all using (auth.uid() = user_id);

create index if not exists idx_x7_feedbacks_message_id on public.x7_feedbacks(message_id);
