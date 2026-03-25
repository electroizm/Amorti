require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const store = require('./src/services/store');
const { simplifyDebts } = require('./src/services/debt');
const partnersRouter = require('./src/routes/partners');
const transactionsRouter = require('./src/routes/transactions');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/partners', partnersRouter);
app.use('/api/transactions', transactionsRouter);

// Özet endpoint: bakiyeler + sadeleştirilmiş borçlar
app.get('/api/summary', (req, res) => {
  const partners = store.getPartners();
  const transactions = store.getTransactions();
  const { balances, transfers } = simplifyDebts(partners, transactions);

  // Toplam harcama hesapla (kişi bazlı)
  const spending = {};
  partners.forEach(p => { spending[p.id] = 0; });
  transactions.filter(t => !t.is_deleted && t.type === 'harcama').forEach(t => {
    spending[t.payer_id] = (spending[t.payer_id] || 0) + t.amount;
  });

  const totalSpending = Object.values(spending).reduce((a, b) => a + b, 0);

  res.json({
    partners,
    balances,
    spending,
    totalSpending,
    suggestedTransfers: transfers
  });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AMØRT! sunucusu çalışıyor: http://localhost:${PORT}`);
});
