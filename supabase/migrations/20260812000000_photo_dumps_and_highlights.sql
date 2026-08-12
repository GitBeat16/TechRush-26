-- ==========================================================================
-- COMPLETE Photo Dumps + Highlights Setup for Supabase
-- Paste this ENTIRE file into Supabase → SQL Editor → Run
-- Safe to re-run: uses IF NOT EXISTS and DROP POLICY IF EXISTS everywhere
-- ==========================================================================

-- ===================== TABLES =====================

-- photo_dumps table
CREATE TABLE IF NOT EXISTS public.photo_dumps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    owner_name TEXT NOT NULL,
    owner_avatar_id TEXT,
    caption TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    taken_on TEXT NOT NULL,
    tags TEXT[],
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- photo_dump_likes table
CREATE TABLE IF NOT EXISTS public.photo_dump_likes (
    dump_id UUID NOT NULL REFERENCES public.photo_dumps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (dump_id, user_id)
);

-- photo_dump_saves table
CREATE TABLE IF NOT EXISTS public.photo_dump_saves (
    dump_id UUID NOT NULL REFERENCES public.photo_dumps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (dump_id, user_id)
);

-- photo_dump_comments table
CREATE TABLE IF NOT EXISTS public.photo_dump_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dump_id UUID NOT NULL REFERENCES public.photo_dumps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    author_name TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- trip_highlights table
CREATE TABLE IF NOT EXISTS public.trip_highlights (
    trip_id UUID PRIMARY KEY REFERENCES public.trips(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    slides JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);


-- ===================== DISABLE RLS ON PHOTO DUMP TABLES =====================
-- The app authenticates via Supabase auth cookies, and the API routes already
-- check auth. Disabling RLS lets the anon/authenticated key actually write rows.

ALTER TABLE public.photo_dumps DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_dump_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_dump_saves DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_dump_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_highlights DISABLE ROW LEVEL SECURITY;


-- ===================== GRANTS =====================
-- Let the Supabase API (anon + authenticated roles) read/write these tables

GRANT SELECT, INSERT, UPDATE, DELETE ON public.photo_dumps TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.photo_dump_likes TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.photo_dump_saves TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.photo_dump_comments TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_highlights TO anon, authenticated, service_role;


-- ===================== STORAGE BUCKET =====================

INSERT INTO storage.buckets (id, name, public)
VALUES ('photo_dumps', 'photo_dumps', true)
ON CONFLICT (id) DO NOTHING;

-- Drop any existing storage policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Uploads" ON storage.objects;
DROP POLICY IF EXISTS "photo_dumps_select" ON storage.objects;
DROP POLICY IF EXISTS "photo_dumps_insert" ON storage.objects;
DROP POLICY IF EXISTS "photo_dumps_update" ON storage.objects;
DROP POLICY IF EXISTS "photo_dumps_delete" ON storage.objects;

-- Allow anyone to read files from the photo_dumps bucket
CREATE POLICY "photo_dumps_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'photo_dumps');

-- Allow anyone to upload files to the photo_dumps bucket
CREATE POLICY "photo_dumps_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photo_dumps');

-- Allow anyone to update files in the photo_dumps bucket
CREATE POLICY "photo_dumps_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'photo_dumps');

-- Allow anyone to delete files from the photo_dumps bucket
CREATE POLICY "photo_dumps_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'photo_dumps');


-- ===================== RELOAD SCHEMA CACHE =====================
-- Forces PostgREST to immediately see the new tables

NOTIFY pgrst, 'reload schema';
