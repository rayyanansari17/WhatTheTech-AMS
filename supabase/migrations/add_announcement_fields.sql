-- Migration: add rich fields to announcements table
-- Run once in Supabase Dashboard → SQL Editor

-- 1. Add new columns
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS event_date   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS event_time   TEXT,
  ADD COLUMN IF NOT EXISTS location     TEXT,
  ADD COLUMN IF NOT EXISTS poster_url   TEXT,
  ADD COLUMN IF NOT EXISTS rsvp_type    TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS rsvp_link    TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NOW();

-- 2. RLS policies — allow organisers to write, everyone (authenticated) to read

-- SELECT: anyone authenticated
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'announcements' AND policyname = 'Anyone can read announcements'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can read announcements" ON announcements FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- INSERT: organisers only
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'announcements' AND policyname = 'Organisers can insert announcements'
  ) THEN
    EXECUTE 'CREATE POLICY "Organisers can insert announcements" ON announcements FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_organiser = true))';
  END IF;
END $$;

-- DELETE: organisers only
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'announcements' AND policyname = 'Organisers can delete announcements'
  ) THEN
    EXECUTE 'CREATE POLICY "Organisers can delete announcements" ON announcements FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_organiser = true))';
  END IF;
END $$;

-- UPDATE: organisers only
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'announcements' AND policyname = 'Organisers can update announcements'
  ) THEN
    EXECUTE 'CREATE POLICY "Organisers can update announcements" ON announcements FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_organiser = true))';
  END IF;
END $$;

-- 3. Storage bucket policy (bucket was already created via API; add row-level access if needed)
-- Organisers can upload to announcement-posters
INSERT INTO storage.buckets (id, name, public)
  VALUES ('announcement-posters', 'announcement-posters', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read on announcement-posters
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Announcement posters are publicly readable'
  ) THEN
    EXECUTE 'CREATE POLICY "Announcement posters are publicly readable" ON storage.objects FOR SELECT TO public USING (bucket_id = ''announcement-posters'')';
  END IF;
END $$;

-- Organisers can upload
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Organisers can upload announcement posters'
  ) THEN
    EXECUTE 'CREATE POLICY "Organisers can upload announcement posters" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''announcement-posters'' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_organiser = true))';
  END IF;
END $$;

SELECT 'Migration complete' AS status;
