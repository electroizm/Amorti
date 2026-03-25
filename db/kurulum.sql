-- ==========================================
-- AMØRT! Veritabanı Şeması (Türkçe)
-- ==========================================

-- Ortaklar tablosu
CREATE TABLE IF NOT EXISTS ortaklar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  isim TEXT NOT NULL,
  renk TEXT NOT NULL DEFAULT '#6366f1',
  silinmis BOOLEAN DEFAULT FALSE,
  olusturma_tarihi TIMESTAMPTZ DEFAULT NOW()
);

-- İşlemler tablosu
CREATE TABLE IF NOT EXISTS islemler (
  id BIGSERIAL PRIMARY KEY,
  tur TEXT NOT NULL CHECK (tur IN ('harcama', 'transfer')),
  odeyen_id UUID NOT NULL REFERENCES ortaklar(id),
  alan_id UUID REFERENCES ortaklar(id),
  tutar NUMERIC(12,2) NOT NULL CHECK (tutar > 0),
  aciklama TEXT DEFAULT '',
  tarih DATE DEFAULT CURRENT_DATE,
  silinmis BOOLEAN DEFAULT FALSE,
  olusturma_tarihi TIMESTAMPTZ DEFAULT NOW()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_islemler_odeyen ON islemler(odeyen_id);
CREATE INDEX IF NOT EXISTS idx_islemler_alan ON islemler(alan_id);
CREATE INDEX IF NOT EXISTS idx_islemler_silinmis ON islemler(silinmis);
CREATE INDEX IF NOT EXISTS idx_ortaklar_silinmis ON ortaklar(silinmis);

-- RLS - şimdilik herkese açık
ALTER TABLE ortaklar ENABLE ROW LEVEL SECURITY;
ALTER TABLE islemler ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ortaklar_herkese_acik') THEN
    CREATE POLICY ortaklar_herkese_acik ON ortaklar FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'islemler_herkese_acik') THEN
    CREATE POLICY islemler_herkese_acik ON islemler FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
