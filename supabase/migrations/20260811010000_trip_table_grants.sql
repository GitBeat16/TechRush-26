-- ---------------------------------------------------------------------------
-- Table grants for the trip tables
--
-- 20260806000000 creates trips, trip_travelers, expenses and expense_splits,
-- enables RLS on all four, and writes careful policies for each — but never
-- grants the `authenticated` role any privilege on the tables themselves. It
-- grants EXECUTE on the helper functions and SELECT on the trip_balances
-- view, and stops there.
--
-- Those are two different mechanisms and both have to say yes. A GRANT
-- decides whether a role may touch a table at all; RLS decides which rows it
-- sees once it may. Without the grant the policies are never reached, and
-- every read and write fails with "permission denied for table trips".
--
-- The visible symptom is not an error, because lib/sync/trips.ts falls back
-- to the local copy when a push fails: trips keep their local ids like
-- "trip-msnosqcc" forever, never gain an owner_id, and anything that needs a
-- real uuid — invites, sharing, cross-device sync — quietly cannot work.
--
-- Idempotent, and safe to run on a project where the grants already exist.
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on public.trips           to authenticated;
grant select, insert, update, delete on public.trip_travelers  to authenticated;
grant select, insert, update, delete on public.expenses        to authenticated;
grant select, insert, update, delete on public.expense_splits  to authenticated;

-- Sequences are not used (every id is a uuid default), so there is nothing
-- to grant there. Views the app reads:
grant select on public.trip_balances to authenticated;

-- Belt and braces for anything added to this schema later by the same role
-- that owns these tables.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
