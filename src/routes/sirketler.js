/**
 * Sirketler Route'lari
 * CRUD: sirket olustur, listele, guncelle, sil
 */
const { Router } = require('express');
const { authGerekli } = require('../middleware/auth');

const router = Router();

router.use(authGerekli);

// GET /api/sirketler — kullanicinin sirketleri
router.get('/', async (req, res) => {
  try {
    const { data: uyeler, error: uyeErr } = await req.supabase
      .from('uyeler')
      .select('sirket_id, rol, sirketler(id, isim, sahip_id, olusturma_tarihi)')
      .eq('kullanici_id', req.kullanici.id)
      .eq('silinmis', false);

    if (uyeErr) throw uyeErr;

    const sirketler = uyeler.map(u => ({
      ...u.sirketler,
      rol: u.rol
    }));

    res.json(sirketler);
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

// POST /api/sirketler — yeni sirket olustur
router.post('/', async (req, res) => {
  const { isim } = req.body;
  if (!isim || !isim.trim()) {
    return res.status(400).json({ hata: 'Sirket ismi zorunludur' });
  }

  try {
    const { data: sirket, error: sirketErr } = await req.supabase
      .from('sirketler')
      .insert({ isim: isim.trim(), sahip_id: req.kullanici.id })
      .select()
      .single();

    if (sirketErr) throw sirketErr;

    const kullaniciIsim = req.kullanici.user_metadata?.isim || req.kullanici.email.split('@')[0];
    const { error: uyeErr } = await req.supabase
      .from('uyeler')
      .insert({
        sirket_id: sirket.id,
        kullanici_id: req.kullanici.id,
        isim: kullaniciIsim,
        renk: '#6366f1',
        rol: 'yonetici'
      });

    if (uyeErr) throw uyeErr;

    res.status(201).json({ ...sirket, rol: 'yonetici' });
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

// PATCH /api/sirketler/:id
router.patch('/:id', async (req, res) => {
  const { isim } = req.body;
  if (!isim || !isim.trim()) {
    return res.status(400).json({ hata: 'Sirket ismi zorunludur' });
  }

  try {
    const { data: sirket } = await req.supabase
      .from('sirketler')
      .select('sahip_id')
      .eq('id', req.params.id)
      .single();

    if (!sirket || sirket.sahip_id !== req.kullanici.id) {
      return res.status(403).json({ hata: 'Sadece sirket sahibi guncelleyebilir' });
    }

    const { data, error } = await req.supabase
      .from('sirketler')
      .update({ isim: isim.trim() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

// DELETE /api/sirketler/:id
router.delete('/:id', async (req, res) => {
  try {
    const { data: sirket } = await req.supabase
      .from('sirketler')
      .select('sahip_id')
      .eq('id', req.params.id)
      .single();

    if (!sirket || sirket.sahip_id !== req.kullanici.id) {
      return res.status(403).json({ hata: 'Sadece sirket sahibi silebilir' });
    }

    const { error } = await req.supabase
      .from('sirketler')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ tamam: true });
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

module.exports = router;
