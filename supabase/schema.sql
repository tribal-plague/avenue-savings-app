-- ─── Profiles ────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null default '',
  salary numeric not null default 0,
  savings_goal numeric not null default 20,
  avatar_color text not null default '#7c3aed',
  currency_symbol text not null default '$',
  created_at timestamptz default now()
);

-- ─── Groups ──────────────────────────────────────────────────────────────────
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'individual',
  invite_code text unique not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- ─── Group Members ───────────────────────────────────────────────────────────
create table public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  is_admin boolean not null default false,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- ─── Categories ──────────────────────────────────────────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete set null,
  name text not null,
  icon text not null default '📦',
  color text not null default '#6366f1',
  budget numeric not null default 0,
  created_at timestamptz default now()
);

-- ─── Expenses ────────────────────────────────────────────────────────────────
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  paid_by uuid references public.profiles(id) on delete set null,
  title text not null,
  amount numeric not null,
  date date not null,
  notes text default '',
  split_between uuid[] default '{}',
  created_at timestamptz default now()
);

-- ─── Invites ─────────────────────────────────────────────────────────────────
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  email text not null,
  sent_by uuid references public.profiles(id) on delete set null,
  status text not null default 'pending',
  created_at timestamptz default now()
);

-- Recurring Bills
create table public.recurring_bills (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  name text not null,
  amount numeric not null default 0,
  category_id uuid references public.categories(id) on delete set null,
  payer_id uuid references public.profiles(id) on delete set null,
  frequency text not null default 'monthly' check (frequency in ('weekly', 'monthly', 'yearly')),
  due_day integer not null default 1 check (due_day between 1 and 31),
  next_due_date date not null,
  status text not null default 'active' check (status in ('active', 'paid', 'skipped', 'paused')),
  notes text default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Activity Log
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ─── Enable Row Level Security ───────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.invites enable row level security;
alter table public.recurring_bills enable row level security;
alter table public.activity_log enable row level security;

-- ─── Profiles RLS ────────────────────────────────────────────────────────────
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "co-member profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.group_members gm1
      join public.group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = auth.uid() and gm2.user_id = public.profiles.id
    )
  );

-- ─── Groups RLS ──────────────────────────────────────────────────────────────
create policy "member can select group" on public.groups
  for select using (
    exists (select 1 from public.group_members where group_id = public.groups.id and user_id = auth.uid())
  );
create policy "member can insert group" on public.groups
  for insert with check (auth.uid() = created_by);
create policy "admin can update group" on public.groups
  for update using (
    exists (select 1 from public.group_members where group_id = public.groups.id and user_id = auth.uid() and is_admin = true)
  );
create policy "admin can delete group" on public.groups
  for delete using (
    exists (select 1 from public.group_members where group_id = public.groups.id and user_id = auth.uid() and is_admin = true)
  );

-- Public group lookup by invite code (for joining)
create policy "anyone can select group by invite code" on public.groups
  for select using (true);

-- ─── Group Members RLS ───────────────────────────────────────────────────────
create policy "member can see members" on public.group_members
  for select using (
    exists (select 1 from public.group_members gm where gm.group_id = public.group_members.group_id and gm.user_id = auth.uid())
  );
create policy "user can join group" on public.group_members
  for insert with check (auth.uid() = user_id);
create policy "admin can update member" on public.group_members
  for update using (
    exists (select 1 from public.group_members gm where gm.group_id = public.group_members.group_id and gm.user_id = auth.uid() and gm.is_admin = true)
  );
create policy "admin can remove member" on public.group_members
  for delete using (
    auth.uid() = user_id or
    exists (select 1 from public.group_members gm where gm.group_id = public.group_members.group_id and gm.user_id = auth.uid() and gm.is_admin = true)
  );

-- ─── Categories RLS ──────────────────────────────────────────────────────────
create policy "member can manage categories" on public.categories
  for all using (
    exists (select 1 from public.group_members where group_id = public.categories.group_id and user_id = auth.uid())
  ) with check (
    exists (select 1 from public.group_members where group_id = public.categories.group_id and user_id = auth.uid())
  );

-- ─── Expenses RLS ────────────────────────────────────────────────────────────
create policy "member can manage expenses" on public.expenses
  for all using (
    exists (select 1 from public.group_members where group_id = public.expenses.group_id and user_id = auth.uid())
  ) with check (
    exists (select 1 from public.group_members where group_id = public.expenses.group_id and user_id = auth.uid())
  );

-- ─── Invites RLS ─────────────────────────────────────────────────────────────
create policy "member can manage invites" on public.invites
  for all using (
    exists (select 1 from public.group_members where group_id = public.invites.group_id and user_id = auth.uid())
  ) with check (
    exists (select 1 from public.group_members where group_id = public.invites.group_id and user_id = auth.uid())
  );

-- Recurring Bills RLS
create policy "member can manage recurring bills" on public.recurring_bills
  for all using (
    exists (select 1 from public.group_members where group_id = public.recurring_bills.group_id and user_id = auth.uid())
  ) with check (
    exists (select 1 from public.group_members where group_id = public.recurring_bills.group_id and user_id = auth.uid())
  );

-- Activity Log RLS
create policy "member can read activity log" on public.activity_log
  for select using (
    exists (select 1 from public.group_members where group_id = public.activity_log.group_id and user_id = auth.uid())
  );

create policy "member can insert activity log" on public.activity_log
  for insert with check (
    exists (select 1 from public.group_members where group_id = public.activity_log.group_id and user_id = auth.uid())
  );

-- ─── Auto-create profile on signup ───────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
