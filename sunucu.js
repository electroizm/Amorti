require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const depo = require('./src/services/depo');
const { borclariSadelestir } = require('./src/services/borc');
const ortaklarRouter = require('./src/routes/ortaklar');
const islemlerRouter = require('./src/routes/islemler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Route'ları
app.use('/api/ortaklar', ortaklarRouter);
app.use('/api/islemler', islemlerRouter);

// Özet endpoint: bakiyeler + sadeleştirilmiş borçlar
app.get('/api/ozet', async (req, res) => {
  try {
    const ortaklar = await depo.getPartners();
    const islemler = await depo.getTransactions();
    const { bakiyeler, transferler } = borclariSadelestir(ortaklar, islemler);

    // Toplam harcama hesapla (kişi bazlı)
    const harcamalar = {};
    ortaklar.forEach(o => { harcamalar[o.id] = 0; });
    islemler.filter(i => !i.silinmis && i.tur === 'harcama').forEach(i => {
      harcamalar[i.odeyen_id] = (harcamalar[i.odeyen_id] || 0) + i.tutar;
    });

    const toplamHarcama = Object.values(harcamalar).reduce((a, b) => a + b, 0);

    res.json({
      ortaklar,
      bakiyeler,
      harcamalar,
      toplamHarcama,
      onerilen_transferler: transferler
    });
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AMØRT! sunucusu çalışıyor: http://localhost:${PORT}`);
});
