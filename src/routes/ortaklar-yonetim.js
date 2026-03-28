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

  // Pay güncelleniyorsa %100 aşım kontrolü (kendi payı hariç)
  if (guncellemeler.pay != null) {
    try {
      const { data: digerOrtaklar } = await req.supabase
        .from('ortaklar')
        .select('pay')
        .eq('sirket_id', req.sirketId)
        .neq('id', req.params.id);

      const digerToplam = (digerOrtaklar || []).reduce((s, o) => s + (o.pay != null ? parseFloat(o.pay) : 0), 0);
      if (digerToplam + guncellemeler.pay > 100) {
        return res.status(400).json({ hata: `Paylar %100'ü aşamaz. Diğer ortakların toplamı: %${digerToplam}` });
      }
    } catch (_) {}
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

// DELETE /api/ortaklar/:id — ortak sil + pay dağıt + harcama devret (yönetici)
router.delete('/:id', rolGerekli('yonetici'), async (req, res) => {
  const { hedef_ortak_id } = req.body || {};

  try {
    // Silinecek ortağı bul
    const { data: silinecek, error: bulErr } = await req.supabase
      .from('ortaklar')
      .select('*')
      .eq('id', req.params.id)
      .eq('sirket_id', req.sirketId)
      .single();

    if (bulErr || !silinecek) return res.status(404).json({ hata: 'Ortak bulunamadı' });

    // Kalan ortakları bul
    const { data: kalanlar } = await req.supabase
      .from('ortaklar')
      .select('*')
      .eq('sirket_id', req.sirketId)
      .neq('id', req.params.id);

    // Pay dağıtımı (orana göre)
    if (silinecek.pay != null && kalanlar && kalanlar.length > 0) {
      const kalanToplamPay = kalanlar.reduce((s, o) => s + (o.pay != null ? parseFloat(o.pay) : 0), 0);
      if (kalanToplamPay > 0) {
        for (const o of kalanlar) {
          if (o.pay == null) continue;
          const yeniPay = parseFloat(o.pay) + (parseFloat(silinecek.pay) * parseFloat(o.pay) / kalanToplamPay);
          await req.supabase
            .from('ortaklar')
            .update({ pay: Math.round(yeniPay * 100) / 100 })
            .eq('id', o.id);
        }
      }
    }

    // Harcamaları devret
    if (hedef_ortak_id) {
      await req.supabase
        .from('islemler')
        .update({ odeyen_ortak_id: hedef_ortak_id })
        .eq('odeyen_ortak_id', req.params.id)
        .eq('sirket_id', req.sirketId);

      await req.supabase
        .from('islemler')
        .update({ alan_ortak_id: hedef_ortak_id })
        .eq('alan_ortak_id', req.params.id)
        .eq('sirket_id', req.sirketId);
    }

    // Ortağı sil
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
