/**
 * Islemler Route'lari
 * Sirket bazli islem CRUD + metin formatlama
 */
const { Router } = require('express');
const { authGerekli, sirketBaglami, rolGerekli } = require('../middleware/auth');
const { turkceHata } = require('../services/hata');
const { formatla } = require('../services/metin');

const router = Router();

router.use(authGerekli, sirketBaglami);

// GET /api/islemler
router.get('/', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('islemler')
      .select('*')
      .eq('sirket_id', req.sirketId)
      .eq('silinmis', false)
      .order('olusturma_tarihi', { ascending: true });

    if (error) throw error;
    res.json(data.map(mapIslem));
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// POST /api/islemler — yeni islem (uye veya yonetici)
router.post('/', rolGerekli('yonetici', 'uye'), async (req, res) => {
  const { tur, odeyen_id, alan_id, tutar, aciklama, tarih, kasa_mi } = req.body;

  if (!odeyen_id || !tutar) {
    return res.status(400).json({ hata: 'odeyen_id ve tutar zorunludur' });
  }
  if (tur === 'transfer' && !alan_id) {
    return res.status(400).json({ hata: 'Transfer icin alan_id zorunludur' });
  }
  if (parseFloat(tutar) <= 0) {
    return res.status(400).json({ hata: 'Tutar sifirdan buyuk olmalidir' });
  }

  try {
    // Kullanicinin metin ayarlarini al
    const { data: ayar } = await req.supabase
      .from('ayarlar')
      .select('harf_bicimi, tr_temizle')
      .eq('kullanici_id', req.kullanici.id)
      .eq('sirket_id', req.sirketId)
      .single();

    const formatliAciklama = aciklama
      ? formatla(aciklama, ayar || {})
      : '';

    const row = {
      sirket_id: req.sirketId,
      tur: tur || 'harcama',
      odeyen_id,
      alan_id: alan_id || null,
      kasa_mi: kasa_mi || false,
      tutar: parseFloat(tutar),
      aciklama: formatliAciklama,
      tarih: tarih || new Date().toISOString().split('T')[0],
      ekleyen_id: req.kullanici.id
    };

    const { data, error } = await req.supabase
      .from('islemler')
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(mapIslem(data));
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// DELETE /api/islemler/:id — soft delete
router.delete('/:id', rolGerekli('yonetici', 'uye'), async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('islemler')
      .update({ silinmis: true })
      .eq('id', parseInt(req.params.id))
      .eq('sirket_id', req.sirketId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ hata: 'Islem bulunamadi' });
    res.json(mapIslem(data));
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

function mapIslem(row) {
  return {
    id: row.id,
    sirket_id: row.sirket_id,
    tur: row.tur,
    odeyen_id: row.odeyen_id,
    alan_id: row.alan_id,
    kasa_mi: row.kasa_mi,
    tutar: parseFloat(row.tutar),
    aciklama: row.aciklama,
    tarih: row.tarih,
    silinmis: row.silinmis,
    ekleyen_id: row.ekleyen_id,
    olusturma_tarihi: row.olusturma_tarihi
  };
}

module.exports = router;
