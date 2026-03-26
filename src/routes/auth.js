/**
 * Auth Route'lari
 * Kayit, giris, cikis, mevcut kullanici
 */
const { Router } = require('express');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const router = Router();

// POST /api/auth/kayit
router.post('/kayit', async (req, res) => {
  const { isim, eposta, sifre } = req.body;
  if (!isim || !eposta || !sifre) {
    return res.status(400).json({ hata: 'isim, eposta ve sifre zorunludur' });
  }
  if (sifre.length < 6) {
    return res.status(400).json({ hata: 'Sifre en az 6 karakter olmalidir' });
  }

  const { data, error } = await supabase.auth.signUp({
    email: eposta,
    password: sifre,
    options: { data: { isim } }
  });

  if (error) {
    return res.status(400).json({ hata: error.message });
  }

  res.status(201).json({
    kullanici: {
      id: data.user.id,
      eposta: data.user.email,
      isim: data.user.user_metadata?.isim
    },
    oturum: data.session
  });
});

// POST /api/auth/giris
router.post('/giris', async (req, res) => {
  const { eposta, sifre } = req.body;
  if (!eposta || !sifre) {
    return res.status(400).json({ hata: 'eposta ve sifre zorunludur' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: eposta,
    password: sifre
  });

  if (error) {
    return res.status(401).json({ hata: 'Gecersiz eposta veya sifre' });
  }

  res.json({
    kullanici: {
      id: data.user.id,
      eposta: data.user.email,
      isim: data.user.user_metadata?.isim
    },
    oturum: data.session
  });
});

// POST /api/auth/cikis
router.post('/cikis', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    await supabase.auth.signOut();
  }
  res.json({ tamam: true });
});

// GET /api/auth/ben
router.get('/ben', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ hata: 'Giris yapmaniz gerekiyor' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ hata: 'Gecersiz token' });
  }

  res.json({
    id: user.id,
    eposta: user.email,
    isim: user.user_metadata?.isim
  });
});

module.exports = router;
