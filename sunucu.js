require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { borclariSadelestir } = require('./src/services/borc');
const { authGerekli, sirketBaglami } = require('./src/middleware/auth');
const { turkceHata } = require('./src/services/hata');

// Route'lar
const authRouter = require('./src/routes/auth');
const sirketlerRouter = require('./src/routes/sirketler');
const davetlerRouter = require('./src/routes/davetler');
const islemlerRouter = require('./src/routes/islemler');
const ortaklarRouter = require('./src/routes/ortaklar');
const ayarlarRouter = require('./src/routes/ayarlar');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Route'lari
app.use('/api/auth', authRouter);
app.use('/api/sirketler', sirketlerRouter);
app.use('/api/davetler', davetlerRouter);
app.use('/api/uyeler', ortaklarRouter);
app.use('/api/islemler', islemlerRouter);
app.use('/api/ayarlar', ayarlarRouter);

// Config: frontend icin Supabase ayarlari (public key, guvenli)
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_ANON_KEY
  });
});

// Ozet endpoint: sirket bazli bakiyeler + sadelestirilmis borclar
app.get('/api/ozet', authGerekli, sirketBaglami, async (req, res) => {
  try {
    // Sirketteki uyeler
    const { data: uyeler, error: uyeErr } = await req.supabase
      .from('uyeler')
      .select('*')
      .eq('sirket_id', req.sirketId)
      .eq('silinmis', false)
      .order('olusturma_tarihi', { ascending: true });

    if (uyeErr) throw uyeErr;

    // Sirketteki islemler
    const { data: islemler, error: islemErr } = await req.supabase
      .from('islemler')
      .select('*')
      .eq('sirket_id', req.sirketId)
      .eq('silinmis', false)
      .order('olusturma_tarihi', { ascending: true });

    if (islemErr) throw islemErr;

    // Borc hesaplama (kasa haric)
    const { bakiyeler, transferler } = borclariSadelestir(uyeler, islemler);

    // Toplam harcama (kasa dahil — raporlama icin)
    const harcamalar = {};
    uyeler.forEach(u => { harcamalar[u.id] = 0; });
    let kasaHarcama = 0;

    islemler.filter(i => i.tur === 'harcama').forEach(i => {
      if (i.kasa_mi) {
        kasaHarcama += parseFloat(i.tutar);
      } else {
        harcamalar[i.odeyen_id] = (harcamalar[i.odeyen_id] || 0) + parseFloat(i.tutar);
      }
    });

    const kisiselToplam = Object.values(harcamalar).reduce((a, b) => a + b, 0);
    const toplamHarcama = kisiselToplam + kasaHarcama;

    res.json({
      uyeler,
      bakiyeler,
      harcamalar,
      kasaHarcama,
      toplamHarcama,
      onerilen_transferler: transferler,
      rol: req.uye.rol
    });
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AMORT! sunucusu calisiyor: http://localhost:${PORT}`);
});
