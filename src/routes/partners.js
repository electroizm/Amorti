const { Router } = require('express');
const store = require('../services/store');

const router = Router();

router.get('/', (req, res) => {
  res.json(store.getPartners());
});

router.post('/', (req, res) => {
  const { name, color } = req.body;
  if (!name || !color) {
    return res.status(400).json({ error: 'name ve color zorunludur' });
  }
  const partner = store.addPartner({ name, color });
  res.status(201).json(partner);
});

router.patch('/:id', (req, res) => {
  const updated = store.updatePartner(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Ortak bulunamadı' });
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const deleted = store.deletePartner(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Ortak bulunamadı' });
  res.json({ ok: true });
});

module.exports = router;
