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
const ortakYonetimRouter = require('./src/routes/ortaklar-yonetim');
const ayarlarRouter = require('./src/routes/ayarlar');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// UptimeRobot / health check — statik dosyalardan önce gelsin
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));
// Production: dist/ (Vite build), Fallback: public/ (eski CDN sürüm)
const fs = require('fs');
const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');
const staticDir = fs.existsSync(distDir) ? distDir : publicDir;
app.use(express.static(staticDir));

// API Route'lari
app.use('/api/auth', authRouter);
app.use('/api/sirketler', sirketlerRouter);
app.use('/api/davetler', davetlerRouter);
app.use('/api/uyeler', ortaklarRouter);
app.use('/api/ortaklar', ortakYonetimRouter);
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
    // Sirket bilgisi
    const { data: sirket, error: sirketErr } = await req.supabase
      .from('sirketler')
      .select('isim, tip')
      .eq('id', req.sirketId)
      .single();

    if (sirketErr) throw sirketErr;

    // Sirketteki uyeler
    const { data: uyeler, error: uyeErr } = await req.supabase
      .from('uyeler')
      .select('*')
      .eq('sirket_id', req.sirketId)
      .eq('silinmis', false)
      .order('olusturma_tarihi', { ascending: true });

    if (uyeErr) throw uyeErr;

    // Sirketteki ortaklar
    const { data: ortaklar, error: ortakErr } = await req.supabase
      .from('ortaklar')
      .select('*')
      .eq('sirket_id', req.sirketId)
      .order('olusturma_tarihi', { ascending: true });

    if (ortakErr) throw ortakErr;

    // Sirketteki islemler
    const { data: islemler, error: islemErr } = await req.supabase
      .from('islemler')
      .select('*')
      .eq('sirket_id', req.sirketId)
      .eq('silinmis', false)
      .order('olusturma_tarihi', { ascending: true });

    if (islemErr) throw islemErr;

    // BİREYSEL kasa: gelir/gider/bakiye hesapla, borç yok
    if (sirket.tip === 'bireysel') {
      let toplamGelir = 0;
      let toplamGider = 0;
      islemler.forEach(i => {
        if (i.tur === 'gelir') toplamGelir += parseFloat(i.tutar);
        else if (i.tur === 'harcama') toplamGider += parseFloat(i.tutar);
      });

      return res.json({
        sirketIsim: sirket.isim,
        sirketTip: 'bireysel',
        uyeler,
        ortaklar: [],
        bakiyeler: {},
        harcamalar: {},
        ortakHarcamalar: {},
        kasaHarcama: 0,
        toplamHarcama: toplamGider,
        toplamGelir,
        toplamGider,
        netBakiye: toplamGelir - toplamGider,
        onerilen_transferler: [],
        rol: req.uye.rol
      });
    }

    // ORTAKLIK kasa: borc hesaplama (kasa haric) — ortaklar varsa ortak bazlı
    const { bakiyeler, transferler } = borclariSadelestir(uyeler, islemler, ortaklar || []);

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

    // Ortak bazlı harcamalar (ortaklar varsa)
    const ortakHarcamalar = {};
    if (ortaklar && ortaklar.length > 0) {
      ortaklar.forEach(o => { ortakHarcamalar[o.id] = 0; });
      islemler.filter(i => i.tur === 'harcama' && !i.kasa_mi).forEach(i => {
        const ortakId = i.odeyen_ortak_id || i.odeyen_id;
        if (ortakHarcamalar[ortakId] !== undefined) {
          ortakHarcamalar[ortakId] += parseFloat(i.tutar);
        }
      });
    }

    res.json({
      sirketIsim: sirket.isim,
      sirketTip: 'ortaklik',
      uyeler,
      ortaklar: ortaklar || [],
      bakiyeler,
      harcamalar,
      ortakHarcamalar,
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
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AMORT! sunucusu calisiyor: http://localhost:${PORT}`);
});
