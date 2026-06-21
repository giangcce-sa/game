-- ===================================================================
-- A4 Friend Leaderboard migration
-- Run this in Supabase SQL Editor (app.supabase.com → SQL Editor)
-- ===================================================================

-- 1. Add friend-system columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "friendCode"    TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "friendCodes"   JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "weeklyStars"   INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "weeklyWeekKey" TEXT;

-- Unique constraint on friend code (skip duplicates if NULL)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_friendcode_idx
  ON profiles ("friendCode")
  WHERE "friendCode" IS NOT NULL;

-- 2. Allow authenticated users to read minimal leaderboard fields from OTHER profiles
--    (the existing RLS "Users manage own profiles" still controls writes / full reads)
--
--    Strategy: create a public view that exposes only safe columns, then grant SELECT.

CREATE OR REPLACE VIEW friend_leaderboard AS
SELECT
  "friendCode" AS "friendCode",
  name,
  avatar,
  "weeklyStars" AS "weeklyStars",
  streak
FROM profiles
WHERE "friendCode" IS NOT NULL;

GRANT SELECT ON friend_leaderboard TO authenticated;

-- 3. Optional: index for fast lookup by code array
CREATE INDEX IF NOT EXISTS profiles_friendcode_lookup ON profiles ("friendCode");

-- ===================================================================
-- Done. Frontend will query the `profiles` table directly by friendCode;
-- if you want stricter privacy, change the SELECT policy on `profiles` to
-- only allow reads via the view above and have the client query that view.
-- ===================================================================
