/**
 * Sirketler Route'lari
 * CRUD: sirket olustur, listele, guncelle, sil
 */
const { Router } = require('express');
const { authGerekli } = require('../middleware/auth');
const { turkceHata } = require('../services/hata');

const router = Router();

router.use(authGerekli);

// GET /api/sirketler — kullanicinin sirketleri (yoksa otomatik olustur)
router.get('/', async (req, res) => {
  try {
    let { data: uyeler, error: uyeErr } = await req.supabase
      .from('uyeler')
      .select('sirket_id, rol, gizli, sirketler(id, isim, tip, sahip_id, olusturma_tarihi)')
      .eq('kullanici_id', req.kullanici.id)
      .eq('silinmis', false);

    if (uyeErr) throw uyeErr;

    // gizli filtresi (varsayılan: gizlileri gösterme)
    const dahilGizli = req.query.dahilGizli === 'true';
    if (!dahilGizli && uyeler) {
      uyeler = uyeler.filter(u => !u.gizli);
    }

    // Hic sirketi yoksa otomatik kisisel alan olustur
    if (!uyeler || uyeler.length === 0) {
      const kullaniciIsim = req.kullanici.user_metadata?.isim || req.kullanici.email.split('@')[0];

      const { data: yeniSirket, error: sirketErr } = await req.supabase
        .from('sirketler')
        .insert({ isim: kullaniciIsim, tip: 'bireysel', sahip_id: req.kullanici.id })
        .select()
        .single();

      if (sirketErr) throw sirketErr;

      const { error: uyeEklErr } = await req.supabase
        .from('uyeler')
        .insert({
          sirket_id: yeniSirket.id,
          kullanici_id: req.kullanici.id,
          isim: kullaniciIsim,
          renk: '#6366f1',
          rol: 'yonetici'
        });

      if (uyeEklErr) throw uyeEklErr;

      return res.json([{ ...yeniSirket, rol: 'yonetici' }]);
    }

    const sirketler = uyeler.map(u => ({
      ...u.sirketler,
      rol: u.rol,
      gizli: u.gizli || false
    }));

    res.json(sirketler);
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// POST /api/sirketler — yeni sirket olustur
router.post('/', async (req, res) => {
  const { isim, tip } = req.body;
  if (!isim || !isim.trim()) {
    return res.status(400).json({ hata: 'Şirket ismi zorunludur' });
  }

  const gecerliTipler = ['bireysel', 'ortaklik'];
  const sirketTip = gecerliTipler.includes(tip) ? tip : 'ortaklik';

  try {
    const { data: sirket, error: sirketErr } = await req.supabase
      .from('sirketler')
      .insert({ isim: isim.trim(), tip: sirketTip, sahip_id: req.kullanici.id })
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
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// PATCH /api/sirketler/:id
router.patch('/:id', async (req, res) => {
  const { isim } = req.body;
  if (!isim || !isim.trim()) {
    return res.status(400).json({ hata: 'Şirket ismi zorunludur' });
  }

  try {
    const { data: sirket } = await req.supabase
      .from('sirketler')
      .select('sahip_id')
      .eq('id', req.params.id)
      .single();

    if (!sirket || sirket.sahip_id !== req.kullanici.id) {
      return res.status(403).json({ hata: 'Sadece şirket sahibi güncelleyebilir' });
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
    res.status(500).json({ hata: turkceHata(err.message) });
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
      return res.status(403).json({ hata: 'Sadece şirket sahibi silebilir' });
    }

    const { error } = await req.supabase
      .from('sirketler')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ tamam: true });
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// PATCH /api/sirketler/:id/gizle — kişisel kasayı gizle
router.patch('/:id/gizle', async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('uyeler')
      .update({ gizli: true })
      .eq('sirket_id', req.params.id)
      .eq('kullanici_id', req.kullanici.id);

    if (error) throw error;
    res.json({ tamam: true });
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// PATCH /api/sirketler/:id/goster — gizli kasayı tekrar aç
router.patch('/:id/goster', async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('uyeler')
      .update({ gizli: false })
      .eq('sirket_id', req.params.id)
      .eq('kullanici_id', req.kullanici.id);

    if (error) throw error;
    res.json({ tamam: true });
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

module.exports = router;
