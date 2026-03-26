/**
 * Supabase & sistem hata mesajlarını Türkçeye çevir
 */

const HATA_ESLEMELERI = {
  // Auth hataları
  'email rate limit exceeded': 'Çok fazla deneme yaptınız. Lütfen birkaç dakika bekleyip tekrar deneyin.',
  'rate limit exceeded': 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.',
  'user already registered': 'Bu e-posta adresi zaten kayıtlı.',
  'user not found': 'Kullanıcı bulunamadı.',
  'invalid login credentials': 'Geçersiz e-posta veya şifre.',
  'invalid claim: missing sub claim': 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.',
  'email not confirmed': 'E-posta adresiniz henüz doğrulanmadı. Lütfen e-postanızı kontrol edin.',
  'new password should be different from the old password': 'Yeni şifre eski şifreden farklı olmalıdır.',
  'password should be at least 6 characters': 'Şifre en az 6 karakter olmalıdır.',
  'signup is disabled': 'Kayıt işlemi geçici olarak devre dışı.',
  'signups not allowed for this instance': 'Kayıt işlemi geçici olarak devre dışı.',
  'token has expired or is invalid': 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.',
  'jwt expired': 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.',

  // DB / RLS hataları
  'infinite recursion detected in policy for relation': 'Veritabanı politika hatası. Lütfen yöneticiyle iletişime geçin.',
  'new row violates row-level security policy': 'Bu işlemi yapmaya yetkiniz yok.',
  'duplicate key value violates unique constraint': 'Bu kayıt zaten mevcut.',
  'violates foreign key constraint': 'İlişkili kayıt bulunamadı.',
  'violates check constraint': 'Geçersiz değer girdiniz.',
  'null value in column': 'Zorunlu alan boş bırakılamaz.',
  'permission denied for table': 'Bu tabloya erişim yetkiniz yok.',
  'relation does not exist': 'Veritabanı tablosu bulunamadı. Lütfen yöneticiyle iletişime geçin.',

  // Ağ hataları
  'failed to fetch': 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.',
  'network error': 'Ağ hatası. İnternet bağlantınızı kontrol edin.',
  'fetch failed': 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.',
  'load failed': 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.',

  // Genel
  'not found': 'Aradığınız kayıt bulunamadı.',
  'internal server error': 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
  'bad request': 'Geçersiz istek.',
  'unauthorized': 'Giriş yapmanız gerekiyor.',
  'forbidden': 'Bu işlemi yapmaya yetkiniz yok.',
  'conflict': 'Bu kayıt zaten mevcut.',
  'too many requests': 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.',
};

/**
 * İngilizce hata mesajını Türkçeye çevir
 * Tam eşleşme yoksa kısmi eşleşme dener
 */
function turkceHata(mesaj) {
  if (!mesaj) return 'Bilinmeyen bir hata oluştu.';

  const kucuk = mesaj.toLowerCase();

  // Tam eşleşme
  if (HATA_ESLEMELERI[kucuk]) return HATA_ESLEMELERI[kucuk];

  // Kısmi eşleşme
  for (const [anahtar, ceviri] of Object.entries(HATA_ESLEMELERI)) {
    if (kucuk.includes(anahtar)) return ceviri;
  }

  // Zaten Türkçe ise veya çevirisi yoksa olduğu gibi döndür
  return mesaj;
}

module.exports = { turkceHata };
