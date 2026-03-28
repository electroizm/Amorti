-- Migrasyon v2.4: ortaklar_insert RLS politikasini guncelle
-- Sorun: Yeni workspace olusturulurken uyeler insert'i ile ortaklar insert'i
-- arasinda RLS timing issue oluyor. Cozum: sirket sahibi de ortak ekleyebilsin.

DROP POLICY IF EXISTS ortaklar_insert ON ortaklar;

CREATE POLICY ortaklar_insert ON ortaklar FOR INSERT WITH CHECK (
  sirket_id IN (SELECT kullanici_sirket_idleri(auth.uid()))
  OR sirket_id IN (SELECT id FROM sirketler WHERE sahip_id = auth.uid())
);
