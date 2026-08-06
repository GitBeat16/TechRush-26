-- ============================================================================
-- Wanderly — themes, trips, companions and expense splitting
--
-- Run this once against your Supabase project (SQL Editor, or
-- `supabase db push` if you use the CLI). It is written to be re-runnable:
-- every statement is guarded, so applying it twice is a no-op.
--
-- What it adds
--   1. profiles.theme            — the manual theme override
--   2. trips                     — trips move off localStorage
--   3. trip_travelers            — who is on a trip
--   4. expenses / expense_splits — what was spent and who owes for it
--   5. RLS so a companion sees the trip they are on, and nothing else
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";  -- gen_random_uuid()


-- ---------------------------------------------------------------------------
-- 1. profiles.theme
--
-- NULL is meaningful: it means "follow my preferred_weather answer". Only a
-- deliberate choice in /profile writes a value here.
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists theme text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_theme_check'
  ) then
    alter table public.profiles
      add constraint profiles_theme_check
      check (theme is null or theme in ('clay', 'sunny', 'snowy', 'rainy'));
  end if;
end $$;

comment on column public.profiles.theme is
  'Manual theme override. NULL means derive it from preferred_weather.';


-- ---------------------------------------------------------------------------
-- 2. trips
--
-- Itinerary, packing and milestones stay as jsonb on purpose. They are only
-- ever read and written as a whole document by the trip owner, they are never
-- filtered or aggregated in SQL, and normalising them would turn one round
-- trip into four. Money and people are relational, because those are shared
-- between users and do get aggregated.
-- ---------------------------------------------------------------------------

create table if not exists public.trips (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users (id) on delete cascade,

  title          text not null,
  country        text not null default '',
  destination_id text not null default '',
  summary        text not null default '',

  start_date     text not null default '',
  end_date       text not null default '',
  days           integer not null default 1 check (days between 1 and 365),

  budget         numeric(12, 2) not null default 0 check (budget >= 0),
  currency       text not null default 'INR',

  tone           text not null default 'lilac'
                 check (tone in ('blush','peach','butter','mint','sky','lilac','surface')),
  status         text not null default 'planning'
                 check (status in ('planning','upcoming','completed')),

  itinerary      jsonb not null default '[]'::jsonb,
  packing        jsonb not null default '[]'::jsonb,
  milestones     jsonb not null default '[]'::jsonb,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists trips_owner_idx        on public.trips (owner_id, created_at desc);
create index if not exists trips_owner_status_idx on public.trips (owner_id, status);


-- ---------------------------------------------------------------------------
-- 3. trip_travelers
--
-- A traveler is anyone a cost can be split with. user_id is nullable so you
-- can add a friend who has no Wanderly account — they exist as a name, and
-- get linked to a real account later if they ever sign up with that email.
-- ---------------------------------------------------------------------------

create table if not exists public.trip_travelers (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips (id) on delete cascade,
  user_id    uuid references auth.users (id) on delete set null,

  name       text not null check (length(trim(name)) > 0),
  initials   text not null default '??',
  tone       text not null default 'mint'
             check (tone in ('blush','peach','butter','mint','sky','lilac','surface')),
  email      text,

  -- Exactly one row per trip is the trip owner themselves.
  is_you     boolean not null default false,
  position   integer not null default 0,

  created_at timestamptz not null default now()
);

-- The same person twice would double their share of every expense.
create unique index if not exists trip_travelers_unique_name
  on public.trip_travelers (trip_id, lower(name));

create unique index if not exists trip_travelers_unique_email
  on public.trip_travelers (trip_id, lower(email))
  where email is not null;

create index if not exists trip_travelers_trip_idx on public.trip_travelers (trip_id, position);
create index if not exists trip_travelers_user_idx on public.trip_travelers (user_id);


-- ---------------------------------------------------------------------------
-- 4. expenses
-- ---------------------------------------------------------------------------

create table if not exists public.expenses (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips (id) on delete cascade,

  label      text not null check (length(trim(label)) > 0),
  amount     numeric(12, 2) not null check (amount >= 0),
  category   text not null default 'other'
             check (category in ('stay','travel','food','activity','shopping','other')),

  -- Restrict, not cascade: deleting a traveler must not silently delete the
  -- money they paid. The app reassigns the payer first.
  paid_by    uuid not null references public.trip_travelers (id) on delete restrict,

  spent_on   date not null default current_date,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists expenses_trip_idx on public.expenses (trip_id, spent_on desc);


-- ---------------------------------------------------------------------------
-- 5. expense_splits
--
-- One row per person sharing one expense. `weight` is 1 for an equal split;
-- storing a weight rather than a fixed amount means an uneven split ("I'll
-- cover two shares") works later without a schema change, and the numbers
-- always re-derive correctly if the expense amount is edited.
-- ---------------------------------------------------------------------------

create table if not exists public.expense_splits (
  expense_id  uuid not null references public.expenses (id) on delete cascade,
  traveler_id uuid not null references public.trip_travelers (id) on delete cascade,
  weight      numeric(8, 3) not null default 1 check (weight > 0),

  primary key (expense_id, traveler_id)
);

create index if not exists expense_splits_traveler_idx on public.expense_splits (traveler_id);


-- ---------------------------------------------------------------------------
-- 6. updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trips_touch_updated_at on public.trips;
create trigger trips_touch_updated_at
  before update on public.trips
  for each row execute function public.touch_updated_at();


-- ---------------------------------------------------------------------------
-- 7. Access helpers
--
-- These are SECURITY DEFINER on purpose. A policy on trips that queries
-- trip_travelers, and a policy on trip_travelers that queries trips, is
-- infinitely recursive under RLS. Reading through a definer function breaks
-- the cycle. Both are STABLE and pinned to an empty search_path so they
-- cannot be hijacked by a shadowing schema.
-- ---------------------------------------------------------------------------

create or replace function public.can_access_trip(p_trip uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.trips t
    where t.id = p_trip
      and t.owner_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.trip_travelers tt
    where tt.trip_id = p_trip
      and tt.user_id = (select auth.uid())
  );
$$;

create or replace function public.owns_trip(p_trip uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.trips t
    where t.id = p_trip
      and t.owner_id = (select auth.uid())
  );
$$;

create or replace function public.can_access_expense(p_expense uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.expenses e
    where e.id = p_expense
      and public.can_access_trip(e.trip_id)
  );
$$;

revoke all on function public.can_access_trip(uuid)    from public;
revoke all on function public.owns_trip(uuid)          from public;
revoke all on function public.can_access_expense(uuid) from public;

grant execute on function public.can_access_trip(uuid)    to authenticated;
grant execute on function public.owns_trip(uuid)          to authenticated;
grant execute on function public.can_access_expense(uuid) to authenticated;


-- ---------------------------------------------------------------------------
-- 8. Row level security
--
-- Shape of the rules:
--   · the owner can do anything to their trip
--   · a companion on the trip can read it, and can log/split expenses
--   · a companion cannot delete the trip or change the roster
-- ---------------------------------------------------------------------------

alter table public.trips           enable row level security;
alter table public.trip_travelers  enable row level security;
alter table public.expenses        enable row level security;
alter table public.expense_splits  enable row level security;

-- ------------------------------------------------------------------- trips
drop policy if exists "trips: read own or joined" on public.trips;
create policy "trips: read own or joined"
  on public.trips for select
  to authenticated
  using (owner_id = (select auth.uid()) or public.can_access_trip(id));

drop policy if exists "trips: owner inserts" on public.trips;
create policy "trips: owner inserts"
  on public.trips for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "trips: owner updates" on public.trips;
create policy "trips: owner updates"
  on public.trips for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "trips: owner deletes" on public.trips;
create policy "trips: owner deletes"
  on public.trips for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- --------------------------------------------------------- trip_travelers
drop policy if exists "travelers: read on accessible trips" on public.trip_travelers;
create policy "travelers: read on accessible trips"
  on public.trip_travelers for select
  to authenticated
  using (public.can_access_trip(trip_id));

drop policy if exists "travelers: owner manages roster" on public.trip_travelers;
create policy "travelers: owner manages roster"
  on public.trip_travelers for all
  to authenticated
  using (public.owns_trip(trip_id))
  with check (public.owns_trip(trip_id));

-- ---------------------------------------------------------------- expenses
drop policy if exists "expenses: read on accessible trips" on public.expenses;
create policy "expenses: read on accessible trips"
  on public.expenses for select
  to authenticated
  using (public.can_access_trip(trip_id));

drop policy if exists "expenses: members log" on public.expenses;
create policy "expenses: members log"
  on public.expenses for insert
  to authenticated
  with check (
    public.can_access_trip(trip_id)
    and created_by = (select auth.uid())
  );

-- You can edit what you logged; the trip owner can edit anything.
drop policy if exists "expenses: author or owner edits" on public.expenses;
create policy "expenses: author or owner edits"
  on public.expenses for update
  to authenticated
  using (created_by = (select auth.uid()) or public.owns_trip(trip_id))
  with check (public.can_access_trip(trip_id));

drop policy if exists "expenses: author or owner deletes" on public.expenses;
create policy "expenses: author or owner deletes"
  on public.expenses for delete
  to authenticated
  using (created_by = (select auth.uid()) or public.owns_trip(trip_id));

-- ----------------------------------------------------------- expense_splits
drop policy if exists "splits: follow the expense" on public.expense_splits;
create policy "splits: follow the expense"
  on public.expense_splits for all
  to authenticated
  using (public.can_access_expense(expense_id))
  with check (public.can_access_expense(expense_id));


-- ---------------------------------------------------------------------------
-- 9. Balances view
--
-- Who is up and who is down, computed in the database rather than by pulling
-- every expense into the browser. Positive = owed money, negative = owes.
--
-- security_invoker means the view is filtered by the caller's RLS, not the
-- view author's — without it this would leak every trip in the table.
-- ---------------------------------------------------------------------------

create or replace view public.trip_balances
with (security_invoker = true) as
with shares as (
  select
    e.trip_id,
    s.traveler_id,
    e.amount * (s.weight / sum(s.weight) over (partition by s.expense_id)) as owed
  from public.expense_splits s
  join public.expenses e on e.id = s.expense_id
),
paid as (
  select e.trip_id, e.paid_by as traveler_id, sum(e.amount) as paid
  from public.expenses e
  group by e.trip_id, e.paid_by
)
select
  t.trip_id,
  t.id                                        as traveler_id,
  t.name,
  coalesce(p.paid, 0)                         as paid,
  coalesce(sh.owed, 0)                        as owed,
  round(coalesce(p.paid, 0) - coalesce(sh.owed, 0), 2) as balance
from public.trip_travelers t
left join paid p
  on p.trip_id = t.trip_id and p.traveler_id = t.id
left join (
  select trip_id, traveler_id, sum(owed) as owed
  from shares
  group by trip_id, traveler_id
) sh
  on sh.trip_id = t.trip_id and sh.traveler_id = t.id;

grant select on public.trip_balances to authenticated;


-- ---------------------------------------------------------------------------
-- 10. Claiming invites
--
-- Someone added by email before they had an account gets linked to it the
-- first time they sign in. Call this from /api/auth/me.
-- ---------------------------------------------------------------------------

create or replace function public.claim_trip_invites()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed integer;
begin
  update public.trip_travelers tt
     set user_id = (select auth.uid())
   where tt.user_id is null
     and tt.email is not null
     and lower(tt.email) = lower((select email from auth.users where id = (select auth.uid())));

  get diagnostics claimed = row_count;
  return claimed;
end;
$$;

revoke all on function public.claim_trip_invites() from public;
grant execute on function public.claim_trip_invites() to authenticated;
