const { Router } = require('express');
const depo = require('../services/depo');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const islemler = await depo.getTransactions();
    res.json(islemler);
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

router.post('/', async (req, res) => {
  const { tur, odeyen_id, alan_id, tutar, aciklama, tarih } = req.body;

  if (!odeyen_id || !tutar) {
    return res.status(400).json({ hata: 'odeyen_id ve tutar zorunludur' });
  }
  if (tur === 'transfer' && !alan_id) {
    return res.status(400).json({ hata: 'Transfer için alan_id zorunludur' });
  }
  if (parseFloat(tutar) <= 0) {
    return res.status(400).json({ hata: 'Tutar sıfırdan büyük olmalıdır' });
  }

  try {
    const islem = await depo.addTransaction({ tur, odeyen_id, alan_id, tutar, aciklama, tarih });
    res.status(201).json(islem);
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const islem = await depo.softDeleteTransaction(parseInt(req.params.id));
    if (!islem) return res.status(404).json({ hata: 'İşlem bulunamadı' });
    res.json(islem);
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

module.exports = router;
