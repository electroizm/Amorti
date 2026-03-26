/**
 * Davetler Route'lari
 * Davet gonder, listele, kabul/red et
 */
const { Router } = require('express');
const { authGerekli, sirketBaglami, rolGerekli } = require('../middleware/auth');
const { turkceHata } = require('../services/hata');

const router = Router();

router.use(authGerekli);

// GET /api/davetler — sirketteki davetler (yonetici)
router.get('/', sirketBaglami, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('davetler')
      .select('*')
      .eq('sirket_id', req.sirketId)
      .order('olusturma_tarihi', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// GET /api/davetler/bekleyen — kullanicinin bekleyen davetleri
router.get('/bekleyen', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('davetler')
      .select('*, sirketler(isim)')
      .eq('eposta', req.kullanici.email)
      .eq('durum', 'bekliyor')
      .order('olusturma_tarihi', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// POST /api/davetler — davet gonder (yonetici)
router.post('/', sirketBaglami, rolGerekli('yonetici'), async (req, res) => {
  const { eposta, rol } = req.body;
  if (!eposta) {
    return res.status(400).json({ hata: 'E-posta zorunludur' });
  }

  const davetRol = rol || 'uye';
  if (!['yonetici', 'uye', 'izleyici'].includes(davetRol)) {
    return res.status(400).json({ hata: 'Geçersiz rol' });
  }

  try {
    // Zaten uye mi kontrol et
    const { data: mevcutUyeler } = await req.supabase
      .from('uyeler')
      .select('kullanici_id, auth_users:kullanici_id(email)')
      .eq('sirket_id', req.sirketId)
      .eq('silinmis', false);

    // Bekleyen davet var mi kontrol et
    const { data: mevcutDavet } = await req.supabase
      .from('davetler')
      .select('id')
      .eq('sirket_id', req.sirketId)
      .eq('eposta', eposta.toLowerCase())
      .eq('durum', 'bekliyor')
      .single();

    if (mevcutDavet) {
      return res.status(400).json({ hata: 'Bu e-postaya zaten bekleyen bir davet var' });
    }

    const { data, error } = await req.supabase
      .from('davetler')
      .insert({
        sirket_id: req.sirketId,
        eposta: eposta.toLowerCase(),
        rol: davetRol,
        davet_eden_id: req.kullanici.id
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// POST /api/davetler/:id/kabul — daveti kabul et
router.post('/:id/kabul', async (req, res) => {
  try {
    const { data: davet, error: davetErr } = await req.supabase
      .from('davetler')
      .select('*')
      .eq('id', req.params.id)
      .eq('eposta', req.kullanici.email)
      .eq('durum', 'bekliyor')
      .single();

    if (davetErr || !davet) {
      return res.status(404).json({ hata: 'Davet bulunamadı veya zaten işlendi' });
    }

    // Uyeyi ekle
    const kullaniciIsim = req.kullanici.user_metadata?.isim || req.kullanici.email.split('@')[0];
    const renkler = ['#FDE047', '#10B981', '#F97316', '#EC4899', '#8B5CF6', '#06B6D4', '#EF4444'];
    const rastgeleRenk = renkler[Math.floor(Math.random() * renkler.length)];

    const { error: uyeErr } = await req.supabase
      .from('uyeler')
      .insert({
        sirket_id: davet.sirket_id,
        kullanici_id: req.kullanici.id,
        isim: kullaniciIsim,
        renk: rastgeleRenk,
        rol: davet.rol
      });

    if (uyeErr) throw uyeErr;

    // Daveti guncelle
    const { error: guncelleErr } = await req.supabase
      .from('davetler')
      .update({ durum: 'kabul' })
      .eq('id', req.params.id);

    if (guncelleErr) throw guncelleErr;

    res.json({ tamam: true, mesaj: 'Davet kabul edildi' });
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// POST /api/davetler/:id/red — daveti reddet
router.post('/:id/red', async (req, res) => {
  try {
    const { data: davet } = await req.supabase
      .from('davetler')
      .select('*')
      .eq('id', req.params.id)
      .eq('eposta', req.kullanici.email)
      .eq('durum', 'bekliyor')
      .single();

    if (!davet) {
      return res.status(404).json({ hata: 'Davet bulunamadı' });
    }

    const { error } = await req.supabase
      .from('davetler')
      .update({ durum: 'red' })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ tamam: true, mesaj: 'Davet reddedildi' });
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

module.exports = router;
