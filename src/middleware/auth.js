/**
 * Auth Middleware
 * JWT dogrulama + per-request Supabase client (RLS icin)
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Admin client: sadece token dogrulama icin
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Kullanicinin token'iyla yeni Supabase client olustur
 * Bu sayede RLS politikalarinda auth.uid() dogru calısır
 */
function supabaseForUser(token) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

/**
 * JWT token dogrula, req.kullanici ve req.supabase set et
 */
async function authGerekli(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ hata: 'Giriş yapmanız gerekiyor' });
  }

  const token = authHeader.split(' ')[1];

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ hata: 'Geçersiz veya süresi dolmuş token' });
  }

  req.kullanici = user;
  req.token = token;
  req.supabase = supabaseForUser(token);
  next();
}

/**
 * Sirket baglami: X-Sirket-Id header'dan sirket_id al
 * Kullanicinin o sirkette uye oldugunu dogrula
 */
async function sirketBaglami(req, res, next) {
  const sirketId = req.headers['x-sirket-id'];
  if (!sirketId) {
    return res.status(400).json({ hata: 'X-Sirket-Id header gerekli' });
  }

  const { data: uye, error } = await req.supabase
    .from('uyeler')
    .select('*')
    .eq('sirket_id', sirketId)
    .eq('kullanici_id', req.kullanici.id)
    .eq('silinmis', false)
    .single();

  if (error || !uye) {
    return res.status(403).json({ hata: 'Bu şirkete erişim yetkiniz yok' });
  }

  req.sirketId = sirketId;
  req.uye = uye;
  next();
}

/**
 * Rol kontrolu: sadece belirtilen roller gecebilir
 */
function rolGerekli(...roller) {
  return (req, res, next) => {
    if (!req.uye || !roller.includes(req.uye.rol)) {
      return res.status(403).json({ hata: 'Bu işlem için yetkiniz yok' });
    }
    next();
  };
}

module.exports = { authGerekli, sirketBaglami, rolGerekli, supabaseAdmin };
