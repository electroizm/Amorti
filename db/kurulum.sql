-- ==========================================
-- AMORT! v2.1 Veritabani Semasi
-- 5 Tablo + RLS (infinite recursion fix)
-- ==========================================

-- Eski politikalari temizle
DROP POLICY IF EXISTS ortaklar_herkese_acik ON ortaklar;
DROP POLICY IF EXISTS islemler_herkese_acik ON islemler;
DROP POLICY IF EXISTS sirketler_select ON sirketler;
DROP POLICY IF EXISTS sirketler_insert ON sirketler;
DROP POLICY IF EXISTS sirketler_update ON sirketler;
DROP POLICY IF EXISTS sirketler_delete ON sirketler;
DROP POLICY IF EXISTS uyeler_select ON uyeler;
DROP POLICY IF EXISTS uyeler_insert ON uyeler;
DROP POLICY IF EXISTS uyeler_update ON uyeler;
DROP POLICY IF EXISTS uyeler_delete ON uyeler;
DROP POLICY IF EXISTS davetler_select ON davetler;
DROP POLICY IF EXISTS davetler_insert ON davetler;
DROP POLICY IF EXISTS davetler_update ON davetler;
DROP POLICY IF EXISTS islemler_select ON islemler;
DROP POLICY IF EXISTS islemler_insert ON islemler;
DROP POLICY IF EXISTS islemler_update ON islemler;
DROP POLICY IF EXISTS ayarlar_select ON ayarlar;
DROP POLICY IF EXISTS ayarlar_insert ON ayarlar;
DROP POLICY IF EXISTS ayarlar_update ON ayarlar;

-- Eski tablolari temizle
DROP TABLE IF EXISTS ayarlar CASCADE;
DROP TABLE IF EXISTS islemler CASCADE;
DROP TABLE IF EXISTS davetler CASCADE;
DROP TABLE IF EXISTS uyeler CASCADE;
DROP TABLE IF EXISTS ortaklar CASCADE;
DROP TABLE IF EXISTS sirketler CASCADE;

-- Helper fonksiyonu temizle
DROP FUNCTION IF EXISTS kullanici_sirket_idleri(UUID);

-- ==========================================
-- HELPER: Kullanicinin uye oldugu sirket ID'leri
-- SECURITY DEFINER = RLS atlanir, infinite recursion olmaz
-- ==========================================
CREATE OR REPLACE FUNCTION kullanici_sirket_idleri(uid UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT sirket_id FROM uyeler
  WHERE kullanici_id = uid AND silinmis = false;
$$;

-- ==========================================
-- 1. SIRKETLER
-- ==========================================
CREATE TABLE IF NOT EXISTS sirketler (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  isim TEXT NOT NULL,
  sahip_id UUID NOT NULL REFERENCES auth.users(id),
  olusturma_tarihi TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. UYELER
-- ==========================================
CREATE TABLE IF NOT EXISTS uyeler (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sirket_id UUID NOT NULL REFERENCES sirketler(id) ON DELETE CASCADE,
  kullanici_id UUID NOT NULL REFERENCES auth.users(id),
  isim TEXT NOT NULL,
  renk TEXT NOT NULL DEFAULT '#6366f1',
  rol TEXT NOT NULL DEFAULT 'uye' CHECK (rol IN ('yonetici', 'uye', 'izleyici')),
  silinmis BOOLEAN DEFAULT FALSE,
  olusturma_tarihi TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sirket_id, kullanici_id)
);

-- ==========================================
-- 3. DAVETLER
-- ==========================================
CREATE TABLE IF NOT EXISTS davetler (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sirket_id UUID NOT NULL REFERENCES sirketler(id) ON DELETE CASCADE,
  eposta TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'uye' CHECK (rol IN ('yonetici', 'uye', 'izleyici')),
  durum TEXT NOT NULL DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'kabul', 'red')),
  davet_eden_id UUID NOT NULL REFERENCES auth.users(id),
  olusturma_tarihi TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. ISLEMLER
-- ==========================================
CREATE TABLE IF NOT EXISTS islemler (
  id BIGSERIAL PRIMARY KEY,
  sirket_id UUID NOT NULL REFERENCES sirketler(id) ON DELETE CASCADE,
  tur TEXT NOT NULL CHECK (tur IN ('harcama', 'transfer')),
  odeyen_id UUID NOT NULL REFERENCES uyeler(id),
  alan_id UUID REFERENCES uyeler(id),
  kasa_mi BOOLEAN DEFAULT FALSE,
  alan_kasa_mi BOOLEAN DEFAULT FALSE,
  tutar NUMERIC(12,2) NOT NULL CHECK (tutar > 0),
  aciklama TEXT DEFAULT '',
  tarih DATE DEFAULT CURRENT_DATE,
  silinmis BOOLEAN DEFAULT FALSE,
  ekleyen_id UUID NOT NULL REFERENCES auth.users(id),
  olusturma_tarihi TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. AYARLAR
-- ==========================================
CREATE TABLE IF NOT EXISTS ayarlar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kullanici_id UUID NOT NULL REFERENCES auth.users(id),
  sirket_id UUID NOT NULL REFERENCES sirketler(id) ON DELETE CASCADE,
  harf_bicimi TEXT NOT NULL DEFAULT 'oldugu_gibi' CHECK (harf_bicimi IN ('buyuk', 'kucuk', 'oldugu_gibi')),
  tr_temizle BOOLEAN DEFAULT FALSE,
  olusturma_tarihi TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kullanici_id, sirket_id)
);

-- ==========================================
-- INDEXLER
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_uyeler_sirket ON uyeler(sirket_id);
CREATE INDEX IF NOT EXISTS idx_uyeler_kullanici ON uyeler(kullanici_id);
CREATE INDEX IF NOT EXISTS idx_uyeler_silinmis ON uyeler(silinmis);
CREATE INDEX IF NOT EXISTS idx_davetler_sirket ON davetler(sirket_id);
CREATE INDEX IF NOT EXISTS idx_davetler_eposta ON davetler(eposta);
CREATE INDEX IF NOT EXISTS idx_davetler_durum ON davetler(durum);
CREATE INDEX IF NOT EXISTS idx_islemler_sirket ON islemler(sirket_id);
CREATE INDEX IF NOT EXISTS idx_islemler_odeyen ON islemler(odeyen_id);
CREATE INDEX IF NOT EXISTS idx_islemler_alan ON islemler(alan_id);
CREATE INDEX IF NOT EXISTS idx_islemler_silinmis ON islemler(silinmis);
CREATE INDEX IF NOT EXISTS idx_ayarlar_kullanici_sirket ON ayarlar(kullanici_id, sirket_id);

-- ==========================================
-- RLS (Row Level Security)
-- Infinite recursion fix: kullanici_sirket_idleri() kullanir
-- ==========================================

-- SIRKETLER
ALTER TABLE sirketler ENABLE ROW LEVEL SECURITY;

CREATE POLICY sirketler_select ON sirketler FOR SELECT USING (
  id IN (SELECT kullanici_sirket_idleri(auth.uid()))
  OR sahip_id = auth.uid()
);

CREATE POLICY sirketler_insert ON sirketler FOR INSERT WITH CHECK (
  sahip_id = auth.uid()
);

CREATE POLICY sirketler_update ON sirketler FOR UPDATE USING (
  sahip_id = auth.uid()
);

CREATE POLICY sirketler_delete ON sirketler FOR DELETE USING (
  sahip_id = auth.uid()
);

-- UYELER: kendi kaydi + ayni sirketteki diger uyeler
ALTER TABLE uyeler ENABLE ROW LEVEL SECURITY;

CREATE POLICY uyeler_select ON uyeler FOR SELECT USING (
  sirket_id IN (SELECT kullanici_sirket_idleri(auth.uid()))
);

CREATE POLICY uyeler_insert ON uyeler FOR INSERT WITH CHECK (
  kullanici_id = auth.uid()
);

CREATE POLICY uyeler_update ON uyeler FOR UPDATE USING (
  sirket_id IN (SELECT kullanici_sirket_idleri(auth.uid()))
);

CREATE POLICY uyeler_delete ON uyeler FOR DELETE USING (
  sirket_id IN (SELECT kullanici_sirket_idleri(auth.uid()))
);

-- DAVETLER
ALTER TABLE davetler ENABLE ROW LEVEL SECURITY;

CREATE POLICY davetler_select ON davetler FOR SELECT USING (
  sirket_id IN (SELECT kullanici_sirket_idleri(auth.uid()))
  OR eposta = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY davetler_insert ON davetler FOR INSERT WITH CHECK (
  sirket_id IN (SELECT kullanici_sirket_idleri(auth.uid()))
);

CREATE POLICY davetler_update ON davetler FOR UPDATE USING (
  eposta = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR sirket_id IN (SELECT kullanici_sirket_idleri(auth.uid()))
);

-- ISLEMLER
ALTER TABLE islemler ENABLE ROW LEVEL SECURITY;

CREATE POLICY islemler_select ON islemler FOR SELECT USING (
  sirket_id IN (SELECT kullanici_sirket_idleri(auth.uid()))
);

CREATE POLICY islemler_insert ON islemler FOR INSERT WITH CHECK (
  sirket_id IN (SELECT kullanici_sirket_idleri(auth.uid()))
);

CREATE POLICY islemler_update ON islemler FOR UPDATE USING (
  sirket_id IN (SELECT kullanici_sirket_idleri(auth.uid()))
);

-- AYARLAR
ALTER TABLE ayarlar ENABLE ROW LEVEL SECURITY;

CREATE POLICY ayarlar_select ON ayarlar FOR SELECT USING (
  kullanici_id = auth.uid()
);

CREATE POLICY ayarlar_insert ON ayarlar FOR INSERT WITH CHECK (
  kullanici_id = auth.uid()
);

CREATE POLICY ayarlar_update ON ayarlar FOR UPDATE USING (
  kullanici_id = auth.uid()
);

-- ==========================================
-- GRANT: authenticated role icin tablo izinleri
-- Supabase bazi durumlarda otomatik vermez
-- ==========================================
GRANT SELECT, INSERT, UPDATE, DELETE ON sirketler TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON uyeler TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON davetler TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON islemler TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ayarlar TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE islemler_id_seq TO authenticated;
