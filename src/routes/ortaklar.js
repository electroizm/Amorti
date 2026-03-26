/**
 * Uyeler (Ortaklar) Route'lari
 * Sirket bazli uye yonetimi
 */
const { Router } = require('express');
const { authGerekli, sirketBaglami, rolGerekli, supabase } = require('../middleware/auth');

const router = Router();

router.use(authGerekli, sirketBaglami);

// GET /api/uyeler — sirketteki uyeler
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('uyeler')
      .select('*')
      .eq('sirket_id', req.sirketId)
      .eq('silinmis', false)
      .order('olusturma_tarihi', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

// PATCH /api/uyeler/:id — uye guncelle (yonetici)
router.patch('/:id', rolGerekli('yonetici'), async (req, res) => {
  const { isim, renk } = req.body;
  const guncellemeler = {};
  if (isim !== undefined) guncellemeler.isim = isim;
  if (renk !== undefined) guncellemeler.renk = renk;

  if (Object.keys(guncellemeler).length === 0) {
    return res.status(400).json({ hata: 'Guncellenecek alan belirtilmedi' });
  }

  try {
    const { data, error } = await supabase
      .from('uyeler')
      .update(guncellemeler)
      .eq('id', req.params.id)
      .eq('sirket_id', req.sirketId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ hata: 'Uye bulunamadi' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

// PATCH /api/uyeler/:id/rol — rol degistir (yonetici)
router.patch('/:id/rol', rolGerekli('yonetici'), async (req, res) => {
  const { rol } = req.body;
  if (!rol || !['yonetici', 'uye', 'izleyici'].includes(rol)) {
    return res.status(400).json({ hata: 'Gecersiz rol' });
  }

  // Kendini degistiremez
  if (req.params.id === req.uye.id) {
    return res.status(400).json({ hata: 'Kendi rolunuzu degistiremezsiniz' });
  }

  try {
    const { data, error } = await supabase
      .from('uyeler')
      .update({ rol })
      .eq('id', req.params.id)
      .eq('sirket_id', req.sirketId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ hata: 'Uye bulunamadi' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

// DELETE /api/uyeler/:id — uye sil / soft delete (yonetici)
router.delete('/:id', rolGerekli('yonetici'), async (req, res) => {
  // Kendini silemez
  if (req.params.id === req.uye.id) {
    return res.status(400).json({ hata: 'Kendinizi cikaramazsiniz' });
  }

  try {
    const { data, error } = await supabase
      .from('uyeler')
      .update({ silinmis: true })
      .eq('id', req.params.id)
      .eq('sirket_id', req.sirketId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ hata: 'Uye bulunamadi' });
    res.json({ tamam: true });
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

module.exports = router;
