-- SKANDHAS Billing — subscription/access-control schema.
-- Run this in the Supabase SQL editor (or via `supabase db push`) once
-- per project. Does NOT touch the customer's billing data — that stays in
-- the browser's localStorage and is never uploaded here.

-- ---------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  user_email text,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_subscription_id text,
  plan text not null check (plan in ('monthly', 'quarterly', 'yearly')),
  status text not null default 'pending'
    check (status in ('active', 'pending', 'expired', 'cancelled', 'failed')),
  amount numeric(10, 2) not null default 0,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_order_id_idx on public.subscriptions (razorpay_order_id);

alter table public.subscriptions enable row level security;

-- Customers may READ only their own subscription row(s).
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- No insert/update/delete policies are defined for the anon/authenticated
-- roles on purpose: all writes happen through the service-role key from
-- server-side API routes (create-order, verify, webhook) and admin server
-- actions, so a customer can never edit status/end_date from the browser.

-- ---------------------------------------------------------------------
-- admins  (software-owner allowlist for the /admin panel)
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- A user may check only whether THEIR OWN id is in the admins table
-- (used by middleware/admin pages to gate access) — they cannot list
-- or modify the table.
create policy "admins_select_own"
  on public.admins for select
  using (auth.uid() = user_id);

-- To make yourself an admin, run this manually in the SQL editor with
-- your own user id from auth.users:
--   insert into public.admins (user_id) values ('00000000-0000-0000-0000-000000000000');
