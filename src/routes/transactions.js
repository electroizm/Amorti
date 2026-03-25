const { Router } = require('express');
const store = require('../services/store');

const router = Router();

router.get('/', (req, res) => {
  res.json(store.getTransactions());
});

router.post('/', (req, res) => {
  const { type, payer_id, receiver_id, amount, description, date } = req.body;

  if (!payer_id || !amount) {
    return res.status(400).json({ error: 'payer_id ve amount zorunludur' });
  }
  if (type === 'transfer' && !receiver_id) {
    return res.status(400).json({ error: 'Transfer için receiver_id zorunludur' });
  }
  if (parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Tutar sıfırdan büyük olmalıdır' });
  }

  const tx = store.addTransaction({ type, payer_id, receiver_id, amount, description, date });
  res.status(201).json(tx);
});

router.delete('/:id', (req, res) => {
  const tx = store.softDeleteTransaction(parseInt(req.params.id));
  if (!tx) return res.status(404).json({ error: 'İşlem bulunamadı' });
  res.json(tx);
});

module.exports = router;
