-- Migration: add regions[] and max_players to the games table
-- Run this in the Supabase SQL editor before running syncFromCSV.ts

ALTER TABLE games
  ADD COLUMN IF NOT EXISTS regions    text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS max_players integer;

-- Optional: expose in the existing view if you have one
-- (no view changes needed if the app reads the table directly)
