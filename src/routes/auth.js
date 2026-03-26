/**
 * Auth Route'lari
 * Kayit, giris, cikis, mevcut kullanici
 */
const { Router } = require('express');
const { createClient } = require('@supabase/supabase-js');
const { turkceHata } = require('../services/hata');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const router = Router();

// POST /api/auth/kayit
router.post('/kayit', async (req, res) => {
  const { isim, eposta, sifre } = req.body;
  if (!isim || !eposta || !sifre) {
    return res.status(400).json({ hata: 'İsim, e-posta ve şifre zorunludur' });
  }
  if (sifre.length < 6) {
    return res.status(400).json({ hata: 'Şifre en az 6 karakter olmalıdır' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: eposta,
      password: sifre,
      options: { data: { isim } }
    });

    if (error) {
      return res.status(400).json({ hata: turkceHata(error.message) });
    }

    // Supabase email onay gerektiriyorsa session null olabilir
    if (!data.session) {
      return res.status(201).json({
        mesaj: 'Hesabınız oluşturuldu. Lütfen e-postanızı kontrol edip hesabınızı doğrulayın.',
        dogrulama_gerekli: true
      });
    }

    res.status(201).json({
      kullanici: {
        id: data.user.id,
        eposta: data.user.email,
        isim: data.user.user_metadata?.isim
      },
      oturum: data.session
    });
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// POST /api/auth/giris
router.post('/giris', async (req, res) => {
  const { eposta, sifre } = req.body;
  if (!eposta || !sifre) {
    return res.status(400).json({ hata: 'E-posta ve şifre zorunludur' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: eposta,
      password: sifre
    });

    if (error) {
      return res.status(401).json({ hata: turkceHata(error.message) });
    }

    res.json({
      kullanici: {
        id: data.user.id,
        eposta: data.user.email,
        isim: data.user.user_metadata?.isim
      },
      oturum: data.session
    });
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// POST /api/auth/cikis
router.post('/cikis', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      await supabase.auth.signOut();
    }
    res.json({ tamam: true });
  } catch (err) {
    res.json({ tamam: true });
  }
});

// GET /api/auth/ben
router.get('/ben', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ hata: 'Giriş yapmanız gerekiyor' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ hata: turkceHata(error?.message || 'Geçersiz token') });
    }

    res.json({
      id: user.id,
      eposta: user.email,
      isim: user.user_metadata?.isim
    });
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

module.exports = router;
