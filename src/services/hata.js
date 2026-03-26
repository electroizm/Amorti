/**
 * Supabase & sistem hata mesajlarini Turkceye cevir
 */

const HATA_ESLEMELERI = {
  // Auth hatalari
  'email rate limit exceeded': 'Cok fazla deneme yaptiniz. Lutfen birkaç dakika bekleyip tekrar deneyin.',
  'rate limit exceeded': 'Cok fazla istek gonderdiniz. Lutfen biraz bekleyin.',
  'user already registered': 'Bu e-posta adresi zaten kayitli.',
  'user not found': 'Kullanici bulunamadi.',
  'invalid login credentials': 'Gecersiz e-posta veya sifre.',
  'invalid claim: missing sub claim': 'Oturum suresi dolmus. Lutfen tekrar giris yapin.',
  'email not confirmed': 'E-posta adresiniz henuz dogrulanmadi. Lutfen e-postanizi kontrol edin.',
  'new password should be different from the old password': 'Yeni sifre eski sifreden farkli olmalidir.',
  'password should be at least 6 characters': 'Sifre en az 6 karakter olmalidir.',
  'signup is disabled': 'Kayit islemi gecici olarak devre disi.',
  'signups not allowed for this instance': 'Kayit islemi gecici olarak devre disi.',
  'token has expired or is invalid': 'Oturum suresi dolmus. Lutfen tekrar giris yapin.',
  'jwt expired': 'Oturum suresi dolmus. Lutfen tekrar giris yapin.',

  // DB / RLS hatalari
  'infinite recursion detected in policy for relation': 'Veritabani politika hatasi. Lutfen yoneticiyle iletisime gecin.',
  'new row violates row-level security policy': 'Bu islemi yapmaya yetkiniz yok.',
  'duplicate key value violates unique constraint': 'Bu kayit zaten mevcut.',
  'violates foreign key constraint': 'Iliskili kayit bulunamadi.',
  'violates check constraint': 'Gecersiz deger girdiniz.',
  'null value in column': 'Zorunlu alan bos birakilamaz.',
  'permission denied for table': 'Bu tabloya erisim yetkiniz yok.',
  'relation does not exist': 'Veritabani tablosu bulunamadi. Lutfen yoneticiyle iletisime gecin.',

  // Ag hatalari
  'failed to fetch': 'Sunucuya baglanilamadi. Internet baglantinizi kontrol edin.',
  'network error': 'Ag hatasi. Internet baglantinizi kontrol edin.',
  'fetch failed': 'Sunucuya baglanilamadi. Internet baglantinizi kontrol edin.',
  'load failed': 'Sunucuya baglanilamadi. Internet baglantinizi kontrol edin.',

  // Genel
  'not found': 'Aradiginiz kayit bulunamadi.',
  'internal server error': 'Sunucu hatasi. Lutfen daha sonra tekrar deneyin.',
  'bad request': 'Gecersiz istek.',
  'unauthorized': 'Giris yapmaniz gerekiyor.',
  'forbidden': 'Bu islemi yapmaya yetkiniz yok.',
  'conflict': 'Bu kayit zaten mevcut.',
  'too many requests': 'Cok fazla istek gonderdiniz. Lutfen biraz bekleyin.',
};

/**
 * Ingilizce hata mesajini Turkceye cevir
 * Tam eslesme yoksa kismi eslesme dener
 */
function turkceHata(mesaj) {
  if (!mesaj) return 'Bilinmeyen bir hata olustu.';

  const kucuk = mesaj.toLowerCase();

  // Tam eslesme
  if (HATA_ESLEMELERI[kucuk]) return HATA_ESLEMELERI[kucuk];

  // Kismi eslesme
  for (const [anahtar, ceviri] of Object.entries(HATA_ESLEMELERI)) {
    if (kucuk.includes(anahtar)) return ceviri;
  }

  // Zaten Turkce ise veya cevirisi yoksa oldugu gibi dondur
  return mesaj;
}

module.exports = { turkceHata };
