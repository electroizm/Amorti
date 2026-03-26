/**
 * Ayarlar Route'lari
 * Kullanici bazli metin ayarlari (harf_bicimi, tr_temizle)
 */
const { Router } = require('express');
const { authGerekli, sirketBaglami } = require('../middleware/auth');
const { turkceHata } = require('../services/hata');

const router = Router();

router.use(authGerekli, sirketBaglami);

// GET /api/ayarlar — kullanicinin bu sirketteki ayarlari
router.get('/', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('ayarlar')
      .select('*')
      .eq('kullanici_id', req.kullanici.id)
      .eq('sirket_id', req.sirketId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Kayit yoksa varsayilan degerler dondur
    res.json(data || {
      harf_bicimi: 'oldugu_gibi',
      tr_temizle: false
    });
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// PATCH /api/ayarlar — ayarlari guncelle (upsert)
router.patch('/', async (req, res) => {
  const { harf_bicimi, tr_temizle } = req.body;
  const guncellemeler = {};

  if (harf_bicimi !== undefined) {
    if (!['buyuk', 'kucuk', 'oldugu_gibi'].includes(harf_bicimi)) {
      return res.status(400).json({ hata: 'Geçersiz harf biçimi' });
    }
    guncellemeler.harf_bicimi = harf_bicimi;
  }
  if (tr_temizle !== undefined) {
    guncellemeler.tr_temizle = !!tr_temizle;
  }

  if (Object.keys(guncellemeler).length === 0) {
    return res.status(400).json({ hata: 'Güncellenecek alan belirtilmedi' });
  }

  try {
    const { data, error } = await req.supabase
      .from('ayarlar')
      .upsert({
        kullanici_id: req.kullanici.id,
        sirket_id: req.sirketId,
        ...guncellemeler
      }, {
        onConflict: 'kullanici_id,sirket_id'
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

module.exports = router;
