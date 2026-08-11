-- ---------------------------------------------------------------------------
-- trip_invites
--
-- Joining someone else's trip is a bootstrapping problem: RLS deliberately
-- hides a trip from anyone who is not already on it, so a prospective member
-- cannot read the trip, cannot read the invite, and cannot add themselves to
-- trip_travelers (that policy is owner-only). Every one of those refusals is
-- correct and none of them can be relaxed without opening the trip up.
--
-- The way through is a pair of SECURITY DEFINER functions that run with the
-- table owner's rights and hand back exactly what a joiner needs and nothing
-- else: peek_trip_invite returns a small preview card, redeem_trip_invite
-- adds the caller to the roster. Both are the only doors in, both validate
-- the code, and both fail closed.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- 1. The table ------------------------------------------------------------

create table if not exists public.trip_invites (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips (id) on delete cascade,
  created_by  uuid not null references auth.users (id) on delete cascade,

  -- Stored uppercase and compared uppercase, so the code is effectively
  -- case-insensitive without needing a functional index on every lookup.
  code        text not null unique check (code = upper(code) and length(code) between 6 and 16),

  -- Free-text reminder of who this was for. Never shown to the joiner.
  label       text not null default '',

  -- NULL means unlimited. Redemption checks uses < max_uses.
  max_uses    integer check (max_uses is null or max_uses > 0),
  uses        integer not null default 0 check (uses >= 0),

  expires_at  timestamptz,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists trip_invites_trip_idx on public.trip_invites (trip_id, created_at desc);

-- 2. Table grants ---------------------------------------------------------
--
-- RLS narrows what a role may reach; it does not grant the role access to the
-- table in the first place. Without this the policies below are never even
-- evaluated and every call fails with "permission denied for table" rather
-- than the row-level refusal you would expect. Supabase's default privileges
-- cover tables created through the dashboard, not necessarily ones created
-- by a migration running as a different role, so state it explicitly.

grant select, insert, update, delete on public.trip_invites to authenticated;

-- 3. Row level security ---------------------------------------------------
--
-- Only the trip owner sees or manages invites. Joiners never select from this
-- table at all — they go through the definer functions below.

alter table public.trip_invites enable row level security;

drop policy if exists "invites: owner manages" on public.trip_invites;
create policy "invites: owner manages"
  on public.trip_invites for all
  to authenticated
  using (public.owns_trip(trip_id))
  with check (public.owns_trip(trip_id) and created_by = (select auth.uid()));

-- 4. Code generation ------------------------------------------------------
--
-- Crockford-ish alphabet: no I, L, O, U, so a code read aloud or typed from a
-- screenshot cannot be ambiguous. 8 characters over 28 symbols is ~37 bits,
-- which is far beyond guessable for something also gated on being unexpired.

-- SECURITY DEFINER matters here: the uniqueness check reads trip_invites,
-- and under RLS the caller only sees invites for trips they own. A collision
-- with someone else's code would be invisible, pass the check, and then fail
-- the unique constraint on insert.
create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  candidate text;
  attempt   integer := 0;
begin
  loop
    candidate := '';
    for idx in 1..8 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;

    exit when not exists (
      select 1 from public.trip_invites i where i.code = candidate
    );

    attempt := attempt + 1;
    if attempt > 12 then
      raise exception 'could not allocate an unused invite code';
    end if;
  end loop;

  return candidate;
end $$;

-- 5. Peek -----------------------------------------------------------------
--
-- The preview a pasted link shows before anyone commits to joining. Returns
-- only what belongs on a join card: where, how long, who is already going and
-- who is inviting. No itinerary, no budget, no expenses, no member identities.

create or replace function public.peek_trip_invite(p_code text)
returns table (
  trip_id        uuid,
  title          text,
  country        text,
  destination_id text,
  summary        text,
  days           integer,
  tone           text,
  owner_name     text,
  traveler_count integer,
  already_member boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    t.id,
    t.title,
    t.country,
    t.destination_id,
    t.summary,
    t.days,
    t.tone,
    coalesce(p.name, 'A traveller'),
    (select count(*)::integer from public.trip_travelers tt where tt.trip_id = t.id),
    exists (
      select 1
      from public.trip_travelers tt
      where tt.trip_id = t.id and tt.user_id = (select auth.uid())
    ) or t.owner_id = (select auth.uid())
  from public.trip_invites i
  join public.trips t on t.id = i.trip_id
  left join public.profiles p on p.id = t.owner_id
  where i.code = upper(trim(p_code))
    and i.revoked_at is null
    and (i.expires_at is null or i.expires_at > now())
    and (i.max_uses is null or i.uses < i.max_uses);
$$;

-- 6. Redeem ---------------------------------------------------------------
--
-- Adds the caller to the roster. Idempotent: redeeming a code you have
-- already used returns the trip without consuming another use, so a
-- double-tapped button or a re-opened link cannot burn a single-use invite.

create or replace function public.redeem_trip_invite(p_code text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_invite  public.trip_invites;
  v_user    uuid := (select auth.uid());
  v_name    text;
  v_email   text;
  v_initials text;
  v_position integer;
  v_tone    text;
  v_tones   constant text[] := array['peach','mint','lilac','sky','blush','butter'];
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  -- FOR UPDATE so two people redeeming the last use of an invite at the same
  -- moment cannot both pass the check.
  select * into v_invite
  from public.trip_invites
  where code = upper(trim(p_code))
  for update;

  if v_invite.id is null then
    raise exception 'invalid code' using errcode = 'P0002';
  end if;
  if v_invite.revoked_at is not null then
    raise exception 'revoked code' using errcode = 'P0003';
  end if;
  if v_invite.expires_at is not null and v_invite.expires_at <= now() then
    raise exception 'expired code' using errcode = 'P0004';
  end if;

  -- Already on this trip, as owner or member: hand back the trip unchanged.
  if exists (
    select 1 from public.trips t
    where t.id = v_invite.trip_id and t.owner_id = v_user
  ) or exists (
    select 1 from public.trip_travelers tt
    where tt.trip_id = v_invite.trip_id and tt.user_id = v_user
  ) then
    return v_invite.trip_id;
  end if;

  if v_invite.max_uses is not null and v_invite.uses >= v_invite.max_uses then
    raise exception 'code fully used' using errcode = 'P0005';
  end if;

  select p.name, p.email into v_name, v_email
  from public.profiles p
  where p.id = v_user;

  v_name := coalesce(nullif(trim(v_name), ''), 'Traveller');

  -- Same two-letter rule the client uses in lib/travelers.ts.
  v_initials := upper(
    case
      when position(' ' in v_name) > 0
        then substr(v_name, 1, 1) || substr(split_part(v_name, ' ', array_length(string_to_array(v_name, ' '), 1)), 1, 1)
      else substr(v_name, 1, 2)
    end
  );

  select coalesce(max(tt.position), -1) + 1 into v_position
  from public.trip_travelers tt
  where tt.trip_id = v_invite.trip_id;

  v_tone := v_tones[1 + (v_position % array_length(v_tones, 1))];

  -- A name collision with someone the owner added by hand would trip the
  -- unique index, so disambiguate rather than fail the join.
  if exists (
    select 1 from public.trip_travelers tt
    where tt.trip_id = v_invite.trip_id and lower(tt.name) = lower(v_name)
  ) then
    v_name := v_name || ' (' || substr(v_user::text, 1, 4) || ')';
  end if;

  insert into public.trip_travelers
    (trip_id, user_id, name, initials, tone, email, is_you, position)
  values
    (v_invite.trip_id, v_user, v_name, v_initials, v_tone, v_email, false, v_position);

  update public.trip_invites
  set uses = uses + 1
  where id = v_invite.id;

  return v_invite.trip_id;
end $$;

-- The functions are the door; the table stays shut.
revoke all on function public.peek_trip_invite(text) from public;
revoke all on function public.redeem_trip_invite(text) from public;
grant execute on function public.peek_trip_invite(text) to authenticated;
grant execute on function public.redeem_trip_invite(text) to authenticated;
grant execute on function public.generate_invite_code() to authenticated;
