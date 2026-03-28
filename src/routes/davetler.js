/**
 * Davetler Route'lari
 * Davet gonder, listele, kabul/red et
 */
const { Router } = require('express');
const { authGerekli, sirketBaglami, rolGerekli, supabaseService } = require('../middleware/auth');
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
  const { eposta, rol, pay } = req.body;
  if (!eposta) {
    return res.status(400).json({ hata: 'E-posta zorunludur' });
  }

  const davetRol = rol || 'uye';
  if (!['yonetici', 'uye', 'izleyici'].includes(davetRol)) {
    return res.status(400).json({ hata: 'Geçersiz rol' });
  }

  const davetPay = pay != null && pay !== '' ? parseFloat(pay) : null;
  if (davetPay != null && (davetPay <= 0 || davetPay > 100)) {
    return res.status(400).json({ hata: 'Pay 0 ile 100 arasında olmalıdır' });
  }

  try {
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

    // Pay verilmişse mevcut toplam pay kontrolü
    if (davetPay != null) {
      const { data: mevcutOrtaklar } = await req.supabase
        .from('ortaklar')
        .select('pay')
        .eq('sirket_id', req.sirketId);

      const toplamBelirtilen = (mevcutOrtaklar || []).reduce((s, o) => s + (o.pay != null ? parseFloat(o.pay) : 0), 0);
      if (toplamBelirtilen + davetPay > 100) {
        return res.status(400).json({ hata: `Paylar %100'ü aşamaz. Mevcut toplam: %${toplamBelirtilen}` });
      }
    }

    const { data, error } = await req.supabase
      .from('davetler')
      .insert({
        sirket_id: req.sirketId,
        eposta: eposta.toLowerCase(),
        rol: davetRol,
        pay: davetPay,
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

    const { data: yeniUye, error: uyeErr } = await req.supabase
      .from('uyeler')
      .insert({
        sirket_id: davet.sirket_id,
        kullanici_id: req.kullanici.id,
        isim: kullaniciIsim,
        renk: rastgeleRenk,
        rol: davet.rol
      })
      .select()
      .single();

    if (uyeErr) throw uyeErr;

    // Davet ortaklık payı içeriyorsa ortak kaydı oluştur ve üyeye bağla
    if (davet.pay != null && yeniUye) {
      const dbClient = supabaseService || req.supabase;
      const { data: yeniOrtak } = await dbClient
        .from('ortaklar')
        .insert({
          sirket_id: davet.sirket_id,
          isim: kullaniciIsim,
          renk: rastgeleRenk,
          pay: parseFloat(davet.pay)
        })
        .select()
        .single();

      if (yeniOrtak) {
        await dbClient
          .from('uyeler')
          .update({ ortak_id: yeniOrtak.id })
          .eq('id', yeniUye.id);
      }
    }

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
