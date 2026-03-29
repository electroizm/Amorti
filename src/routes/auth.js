/**
 * Auth Route'lari
 * Kayit, giris, cikis, mevcut kullanici, profil, avatar
 */
const { Router } = require('express');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const { turkceHata } = require('../services/hata');
const { authGerekli, supabaseService } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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
        isim: data.user.user_metadata?.isim,
        avatar_url: data.user.user_metadata?.avatar_url || null
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
        isim: data.user.user_metadata?.isim,
        avatar_url: data.user.user_metadata?.avatar_url || null
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
      isim: user.user_metadata?.isim || null,
      avatar_url: user.user_metadata?.avatar_url || null
    });
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// PATCH /api/auth/profil — isim guncelle
router.patch('/profil', authGerekli, async (req, res) => {
  const { isim } = req.body;
  if (!isim || !isim.trim()) {
    return res.status(400).json({ hata: 'İsim zorunludur' });
  }

  try {
    // Supabase auth metadata güncelle (service admin API gerektirir)
    const { supabaseAdmin } = require('../middleware/auth');
    if (supabaseService) {
      const { error: authErr } = await supabaseService.auth.admin.updateUserById(
        req.kullanici.id,
        { user_metadata: { isim: isim.trim() } }
      );
      if (authErr) throw authErr;
    }

    // Tüm aktif üye kayıtlarındaki ismi de güncelle
    const db = supabaseService || req.supabase;
    await db
      .from('uyeler')
      .update({ isim: isim.trim() })
      .eq('kullanici_id', req.kullanici.id)
      .eq('silinmis', false);

    res.json({ tamam: true, isim: isim.trim() });
  } catch (err) {
    console.error('[profil guncelle hatasi]', err.message);
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// POST /api/auth/avatar — profil fotoğrafı yükle
router.post('/avatar', authGerekli, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ hata: 'Dosya seçilmedi' });

  const mime = req.file.mimetype;
  if (!mime.startsWith('image/')) return res.status(400).json({ hata: 'Sadece resim dosyası yüklenebilir' });

  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const dosyaYolu = `${req.kullanici.id}/avatar.${ext}`;

  try {
    if (!supabaseService) throw new Error('Depolama servisi yapılandırılmamış');

    const { error: uploadErr } = await supabaseService.storage
      .from('avatars')
      .upload(dosyaYolu, req.file.buffer, { contentType: mime, upsert: true });
    if (uploadErr) throw uploadErr;

    const { data: { publicUrl } } = supabaseService.storage.from('avatars').getPublicUrl(dosyaYolu);

    await supabaseService.auth.admin.updateUserById(req.kullanici.id, {
      user_metadata: { avatar_url: publicUrl }
    });

    res.json({ avatar_url: publicUrl });
  } catch (err) {
    console.error('[avatar upload hatasi]', err.message);
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// PATCH /api/auth/eposta — e-posta değiştir
router.patch('/eposta', authGerekli, async (req, res) => {
  const { eposta } = req.body;
  if (!eposta || !eposta.includes('@')) return res.status(400).json({ hata: 'Geçerli bir e-posta girin' });

  try {
    if (!supabaseService) throw new Error('Servis yapılandırılmamış');
    const { error } = await supabaseService.auth.admin.updateUserById(req.kullanici.id, { email: eposta });
    if (error) throw error;
    res.json({ tamam: true });
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

// PATCH /api/auth/sifre — şifre değiştir
router.patch('/sifre', authGerekli, async (req, res) => {
  const { sifre } = req.body;
  if (!sifre || sifre.length < 6) return res.status(400).json({ hata: 'Şifre en az 6 karakter olmalıdır' });

  try {
    if (!supabaseService) throw new Error('Servis yapılandırılmamış');
    const { error } = await supabaseService.auth.admin.updateUserById(req.kullanici.id, { password: sifre });
    if (error) throw error;
    res.json({ tamam: true });
  } catch (err) {
    res.status(500).json({ hata: turkceHata(err.message) });
  }
});

module.exports = router;
