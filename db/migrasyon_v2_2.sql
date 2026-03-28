-- ==========================================
-- AMORT! v2.2 Migration
-- Bireysel / Ortaklik kasa tipleri + Gelir islemi
-- Supabase SQL Editor'de calistirin
-- ==========================================

-- 1. sirketler.tip constraint guncelle
ALTER TABLE sirketler DROP CONSTRAINT IF EXISTS sirketler_tip_check;
ALTER TABLE sirketler ADD CONSTRAINT sirketler_tip_check CHECK (tip IN ('bireysel', 'ortaklik'));
ALTER TABLE sirketler ALTER COLUMN tip SET DEFAULT 'ortaklik';

-- 2. Eski 'sirket' degerlerini 'ortaklik' yap
UPDATE sirketler SET tip = 'ortaklik' WHERE tip NOT IN ('bireysel', 'ortaklik');

-- 3. islemler.tur constraint guncelle: 'gelir' ekle
ALTER TABLE islemler DROP CONSTRAINT IF EXISTS islemler_tur_check;
ALTER TABLE islemler ADD CONSTRAINT islemler_tur_check CHECK (tur IN ('harcama', 'transfer', 'gelir'));
