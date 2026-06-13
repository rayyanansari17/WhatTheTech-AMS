-- Migration: add team-level check-in token
-- Run once in Supabase Dashboard → SQL Editor

ALTER TABLE teams ADD COLUMN IF NOT EXISTS checkin_token TEXT UNIQUE;

-- Generate tokens for existing teams that don't have one yet
UPDATE teams
SET checkin_token = lower(
  substr(md5(random()::text || id::text), 1, 32)
)
WHERE checkin_token IS NULL;

SELECT 'Migration complete: ' || count(*) || ' teams now have a checkin_token' AS status
FROM teams WHERE checkin_token IS NOT NULL;
