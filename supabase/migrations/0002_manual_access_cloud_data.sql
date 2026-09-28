-- Manual, one-time access plus cross-device business data.
-- Run after 0001_subscriptions.sql in Supabase SQL Editor.
create table if not exists public.user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  business_name text not null default '',
  paid boolean not null default false,
  access_granted boolean not null default false,
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.account_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{"version":1,"products":[],"bills":[],"billCounter":1,"settings":{"businessName":"","tagline":"","address":"","phone":"","email":"","gstNumber":"","invoiceFooter":"Thank you for your business!"}}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_access enable row level security;
alter table public.account_data enable row level security;
drop policy if exists "users_read_own_access" on public.user_access;
create policy "users_read_own_access" on public.user_access for select using (auth.uid() = user_id);
drop policy if exists "users_read_own_data" on public.account_data;
create policy "users_read_own_data" on public.account_data for select using (auth.uid() = user_id);
drop policy if exists "users_insert_own_data" on public.account_data;
create policy "users_insert_own_data" on public.account_data for insert with check (auth.uid() = user_id);
drop policy if exists "users_update_own_data" on public.account_data;
create policy "users_update_own_data" on public.account_data for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.initialize_billing_account()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_access(user_id,email,business_name)
    values(new.id, coalesce(new.email,''), coalesce(new.raw_user_meta_data->>'business_name',''))
    on conflict(user_id) do update set email=excluded.email, business_name=excluded.business_name;
  insert into public.account_data(user_id) values(new.id) on conflict(user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_billing on auth.users;
create trigger on_auth_user_created_billing after insert on auth.users
for each row execute procedure public.initialize_billing_account();

-- Include accounts that were registered before this migration was installed.
insert into public.user_access(user_id,email,business_name)
select id, coalesce(email,''), coalesce(raw_user_meta_data->>'business_name','') from auth.users
on conflict(user_id) do update set email=excluded.email, business_name=excluded.business_name;
insert into public.account_data(user_id)
select id from auth.users on conflict(user_id) do nothing;

-- Existing app customer data lived in localStorage and is not present in Supabase.
-- Existing subscription rows are retained for reference; new access is controlled only by user_access.

-- Refresh Supabase REST schema cache after creating the new tables.
notify pgrst, 'reload schema';
