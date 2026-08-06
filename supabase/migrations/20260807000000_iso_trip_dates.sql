-- ============================================================================
-- Wanderly — normalise trip dates to ISO
--
-- OPTIONAL. The app does not need this to work: trips.start_date and
-- trips.end_date are `text`, ISO strings fit them unchanged, and the client
-- parses any legacy value it reads (lib/store.ts → migrateTrip) then writes
-- ISO back on the next save.
--
-- Run it if you would rather not wait for every trip to be touched, or if you
-- want to query dates in SQL — `where start_date >= '2026-01-01'` only sorts
-- correctly once every row is ISO.
--
-- Safe to run twice: rows already in YYYY-MM-DD are left alone, and anything
-- unparseable is emptied rather than guessed at, which is exactly what the
-- client does with it.
-- ============================================================================

do $$
declare
  updated integer;
begin
  -- '14 Oct 2026' / '06 February 2027' → 2026-10-14
  update public.trips
  set start_date = to_char(to_date(start_date, 'DD Mon YYYY'), 'YYYY-MM-DD')
  where start_date ~ '^\d{1,2} [A-Za-z]{3,9} \d{4}$';

  update public.trips
  set end_date = to_char(to_date(end_date, 'DD Mon YYYY'), 'YYYY-MM-DD')
  where end_date ~ '^\d{1,2} [A-Za-z]{3,9} \d{4}$';

  -- 'Oct 14 2026' → 2026-10-14
  update public.trips
  set start_date = to_char(to_date(start_date, 'Mon DD YYYY'), 'YYYY-MM-DD')
  where start_date ~ '^[A-Za-z]{3,9} \d{1,2} \d{4}$';

  update public.trips
  set end_date = to_char(to_date(end_date, 'Mon DD YYYY'), 'YYYY-MM-DD')
  where end_date ~ '^[A-Za-z]{3,9} \d{1,2} \d{4}$';

  -- Placeholders like 'Dates to set' become empty, which is the app's
  -- honest representation of "no date chosen yet".
  update public.trips
  set start_date = ''
  where start_date <> '' and start_date !~ '^\d{4}-\d{2}-\d{2}$';

  update public.trips
  set end_date = ''
  where end_date <> '' and end_date !~ '^\d{4}-\d{2}-\d{2}$';

  get diagnostics updated = row_count;
  raise notice 'trip dates normalised';
end $$;


-- ---------------------------------------------------------------------------
-- Keep them that way.
--
-- Empty is allowed on purpose: a trip can exist before its dates do.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'trips_start_date_iso'
  ) then
    alter table public.trips
      add constraint trips_start_date_iso
      check (start_date = '' or start_date ~ '^\d{4}-\d{2}-\d{2}$');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'trips_end_date_iso'
  ) then
    alter table public.trips
      add constraint trips_end_date_iso
      check (end_date = '' or end_date ~ '^\d{4}-\d{2}-\d{2}$');
  end if;
end $$;

comment on column public.trips.start_date is
  'ISO YYYY-MM-DD, or empty when the trip has no dates yet.';
comment on column public.trips.end_date is
  'ISO YYYY-MM-DD, or empty when the trip has no dates yet.';


-- ---------------------------------------------------------------------------
-- Ordering by date is now the calendar's main query, so give it an index.
-- ---------------------------------------------------------------------------

create index if not exists trips_owner_start_idx
  on public.trips (owner_id, start_date);
