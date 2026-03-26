/**
 * Auth Middleware
 * JWT dogrulama + sirket baglami (X-Sirket-Id header)
 */
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * JWT token dogrula, req.kullanici set et
 */
async function authGerekli(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ hata: 'Giris yapmaniz gerekiyor' });
  }

  const token = authHeader.split(' ')[1];

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ hata: 'Gecersiz veya suresi dolmus token' });
  }

  req.kullanici = user;
  req.token = token;
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

  // Kullanicinin bu sirkette aktif uyeligini kontrol et
  const { data: uye, error } = await supabase
    .from('uyeler')
    .select('*')
    .eq('sirket_id', sirketId)
    .eq('kullanici_id', req.kullanici.id)
    .eq('silinmis', false)
    .single();

  if (error || !uye) {
    return res.status(403).json({ hata: 'Bu sirkete erisim yetkiniz yok' });
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
      return res.status(403).json({ hata: 'Bu islem icin yetkiniz yok' });
    }
    next();
  };
}

module.exports = { authGerekli, sirketBaglami, rolGerekli, supabase };
