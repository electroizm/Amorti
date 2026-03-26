-- ==========================================
-- AMORT! RLS Fix - Bu dosyayi Supabase SQL Editor'de calistir
-- Tum eski politikalari siler, yenilerini olusturur
-- ==========================================

-- 1. TUM POLITIKALARI SIL
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 2. HELPER FONKSIYON (eski varsa sil, yeniden olustur)
DROP FUNCTION IF EXISTS kullanici_sirket_idleri(UUID);

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

-- 3. RLS AKTIF ET (zaten aktifse sorun olmaz)
ALTER TABLE sirketler ENABLE ROW LEVEL SECURITY;
ALTER TABLE uyeler ENABLE ROW LEVEL SECURITY;
ALTER TABLE davetler ENABLE ROW LEVEL SECURITY;
ALTER TABLE islemler ENABLE ROW LEVEL SECURITY;
ALTER TABLE ayarlar ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. YENI POLITIKALAR
-- ==========================================

-- SIRKETLER
CREATE POLICY sirketler_select ON sirketler FOR SELECT USING (
  sahip_id = auth.uid()
  OR id IN (SELECT kullanici_sirket_idleri(auth.uid()))
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

-- UYELER (hic self-reference yok, sadece helper fonksiyon veya kendi kaydi)
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
CREATE POLICY ayarlar_select ON ayarlar FOR SELECT USING (
  kullanici_id = auth.uid()
);
CREATE POLICY ayarlar_insert ON ayarlar FOR INSERT WITH CHECK (
  kullanici_id = auth.uid()
);
CREATE POLICY ayarlar_update ON ayarlar FOR UPDATE USING (
  kullanici_id = auth.uid()
);
