-- ==========================================
-- AMORT! v2.3 Migration
-- davetler tablosuna ortak pay kolonu
-- Supabase SQL Editor'de calistirin
-- ==========================================

ALTER TABLE davetler ADD COLUMN IF NOT EXISTS pay NUMERIC(5,2) DEFAULT NULL;
