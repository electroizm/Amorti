const { Router } = require('express');
const depo = require('../services/depo');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const ortaklar = await depo.getPartners();
    res.json(ortaklar);
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

router.post('/', async (req, res) => {
  const { isim, renk } = req.body;
  if (!isim || !renk) {
    return res.status(400).json({ hata: 'isim ve renk zorunludur' });
  }
  try {
    const ortak = await depo.addPartner({ isim, renk });
    res.status(201).json(ortak);
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const updated = await depo.updatePartner(req.params.id, req.body);
    if (!updated) return res.status(404).json({ hata: 'Ortak bulunamadı' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const silindi = await depo.deletePartner(req.params.id);
    if (!silindi) return res.status(404).json({ hata: 'Ortak bulunamadı' });
    res.json({ tamam: true });
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

module.exports = router;
