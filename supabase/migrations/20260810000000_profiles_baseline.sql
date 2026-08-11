-- ---------------------------------------------------------------------------
-- profiles — baseline
--
-- The application has always depended on public.profiles (every auth route
-- funnels through lib/supabase/profile.ts), but no migration in this repo
-- ever created it: 20260806000000 only runs `alter table public.profiles`,
-- assuming it already exists from a hand-run statement in the dashboard.
--
-- On any project where the table is missing, or where RLS is on without a
-- policy letting a user reach their own row, every profile read fails. That
-- used to make an authenticated user look signed out to /api/auth/me while
-- proxy.ts still saw a valid session, and the two gates redirected each
-- other between /login and / forever.
--
-- Everything below is idempotent, so this is safe to apply to a project
-- that already has the table, columns, policies or trigger.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- 1. The table ------------------------------------------------------------

create table if not exists public.profiles (
  id                      uuid primary key references auth.users (id) on delete cascade,
  email                   text        not null default '',
  name                    text        not null default 'Traveller',
  avatar_id               text        not null default 'sunseeker',
  home_city               text        not null default '',
  provider                text        not null default 'email',
  created_at              timestamptz not null default now(),

  -- Onboarding answers. All nullable: they are filled in by /onboarding.
  preferred_destinations  text[],
  preferred_weather       text,
  budget                  text,
  travel_style            text,
  trip_duration           text,
  travel_group            text,
  onboarding_completed    boolean     not null default false,

  -- NULL means "follow my preferred_weather answer".
  theme                   text
);

-- Columns, for a table that predates this file.
alter table public.profiles add column if not exists email                  text        not null default '';
alter table public.profiles add column if not exists name                   text        not null default 'Traveller';
alter table public.profiles add column if not exists avatar_id              text        not null default 'sunseeker';
alter table public.profiles add column if not exists home_city              text        not null default '';
alter table public.profiles add column if not exists provider               text        not null default 'email';
alter table public.profiles add column if not exists created_at             timestamptz not null default now();
alter table public.profiles add column if not exists preferred_destinations text[];
alter table public.profiles add column if not exists preferred_weather      text;
alter table public.profiles add column if not exists budget                 text;
alter table public.profiles add column if not exists travel_style           text;
alter table public.profiles add column if not exists trip_duration          text;
alter table public.profiles add column if not exists travel_group           text;
alter table public.profiles add column if not exists onboarding_completed   boolean     not null default false;
alter table public.profiles add column if not exists theme                  text;

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

-- 2. Row level security ---------------------------------------------------
--
-- A profile is private to its owner. auth.uid() is the id of the signed-in
-- user, and the primary key is that same id, so every policy is a direct
-- comparison — no subqueries, no recursion.

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3. Auto-create on signup ------------------------------------------------
--
-- ensureProfile() in the application creates the row on first sight, which
-- covers users who already exist. This trigger closes the same gap at the
-- source, so a row exists the moment auth.users gains one — including for
-- sign-ups that never touch this app (dashboard invites, for example).
--
-- SECURITY DEFINER because the trigger runs before any request context, so
-- auth.uid() is null and the insert policy above would reject it.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_id, home_city, provider)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Traveller'
    ),
    coalesce(nullif(new.raw_user_meta_data ->> 'avatar_id', ''), 'sunseeker'),
    coalesce(new.raw_user_meta_data ->> 'home_city', ''),
    case
      when new.raw_app_meta_data ->> 'provider' = 'google' then 'google'
      else 'email'
    end
  )
  on conflict (id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Backfill -------------------------------------------------------------
--
-- Anyone who signed up before this migration and has no row yet.

insert into public.profiles (id, email, name, avatar_id, home_city, provider)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'Traveller'
  ),
  coalesce(nullif(u.raw_user_meta_data ->> 'avatar_id', ''), 'sunseeker'),
  coalesce(u.raw_user_meta_data ->> 'home_city', ''),
  case
    when u.raw_app_meta_data ->> 'provider' = 'google' then 'google'
    else 'email'
  end
from auth.users u
on conflict (id) do nothing;
