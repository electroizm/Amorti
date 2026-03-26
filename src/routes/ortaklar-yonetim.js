/**
 * Ortaklar (Şirket Ortakları) Route'ları
 * Şirket ortağı CRUD — harcama paylaşımı bunlara göre yapılır
 */
const { Router } = require('express');
const { authGerekli, sirketBaglami, rolGerekli } = require('../middleware/auth');
const { turkceHata } = require('../services/hata');

const router = Router();

router.use(authGerekli, sirketBaglami);

// GET /api/ortaklar
router.get('/', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('ortaklar')
      .select('*')
      .eq('sirket_id', req.sirketId)
      .order('olusturma_tarihi', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// POST /api/ortaklar — yeni ortak (yönetici)
router.post('/', rolGerekli('yonetici'), async (req, res) => {
  const { isim, renk, pay } = req.body;
  if (!isim || !isim.trim()) {
    return res.status(400).json({ hata: 'Ortak ismi zorunludur' });
  }

  try {
    const row = {
      sirket_id: req.sirketId,
      isim: isim.trim(),
      renk: renk || '#6366f1',
      pay: pay != null ? parseFloat(pay) : null
    };

    const { data, error } = await req.supabase
      .from('ortaklar')
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// PATCH /api/ortaklar/:id — ortak güncelle (yönetici)
router.patch('/:id', rolGerekli('yonetici'), async (req, res) => {
  const { isim, renk, pay } = req.body;
  const guncellemeler = {};
  if (isim !== undefined) guncellemeler.isim = isim.trim();
  if (renk !== undefined) guncellemeler.renk = renk;
  if (pay !== undefined) guncellemeler.pay = pay != null ? parseFloat(pay) : null;

  if (Object.keys(guncellemeler).length === 0) {
    return res.status(400).json({ hata: 'Güncellenecek alan belirtilmedi' });
  }

  try {
    const { data, error } = await req.supabase
      .from('ortaklar')
      .update(guncellemeler)
      .eq('id', req.params.id)
      .eq('sirket_id', req.sirketId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ hata: 'Ortak bulunamadı' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// DELETE /api/ortaklar/:id — ortak sil (yönetici)
router.delete('/:id', rolGerekli('yonetici'), async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('ortaklar')
      .delete()
      .eq('id', req.params.id)
      .eq('sirket_id', req.sirketId);

    if (error) throw error;
    res.json({ tamam: true });
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

module.exports = router;
