-- Phase 21: User Profile Settings (Workspace name, Timezone, Language, Notifications)

alter table public.user_profiles 
  add column if not exists workspace_name text not null default 'My Workspace',
  add column if not exists timezone text not null default 'UTC',
  add column if not exists language text not null default 'es',
  add column if not exists whatsapp_alerts boolean not null default false,
  add column if not exists email_digests boolean not null default false;

-- Allow users to update their own profile settings
create policy "Users update own profile" on public.user_profiles
  for update using (auth.uid() = user_id);
