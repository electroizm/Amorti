/**
 * AMØRT! Frontend Hata Sanitize Modülü
 * Backend'den gelen veya fetch sırasında oluşan hataları
 * kullanıcı dostu, dile uygun mesajlara çevirir.
 */
window.HataSanitize = {
  /**
   * Hata mesajını kullanıcı dostu hale getir
   * Backend zaten turkceHata() ile çeviriyor ama:
   * - fetch/network hataları client-side oluşur
   * - Bazı hatalar ham gelir (Supabase JS SDK)
   */
  cevir(mesaj) {
    if (!mesaj) return t('hata.genelHata');

    const kucuk = mesaj.toLowerCase();

    // Network / fetch hataları (tarayıcıdan gelir, backend'e ulaşmaz)
    const agHatalari = {
      'failed to fetch': 'hata.agHatasi',
      'network error': 'hata.agHatasi',
      'networkerror': 'hata.agHatasi',
      'fetch failed': 'hata.agHatasi',
      'load failed': 'hata.agHatasi',
      'the internet connection appears to be offline': 'hata.cevrimdisi',
      'the network connection was lost': 'hata.cevrimdisi',
      'net::err_internet_disconnected': 'hata.cevrimdisi',
      'net::err_network_changed': 'hata.agHatasi',
      'aborted': 'hata.istekIptal',
      'the user aborted a request': 'hata.istekIptal',
      'timeout': 'hata.zamanAsimi',
      'the operation timed out': 'hata.zamanAsimi'
    };

    // Tam eşleşme
    if (agHatalari[kucuk]) return t(agHatalari[kucuk]);

    // Kısmi eşleşme
    for (const [anahtar, cevirAnahtar] of Object.entries(agHatalari)) {
      if (kucuk.includes(anahtar)) return t(cevirAnahtar);
    }

    // Backend zaten çevirdiyse veya Türkçe ise olduğu gibi döndür
    return mesaj;
  },

  /**
   * Hata toast'u göster (App.toast ile)
   */
  goster(err) {
    const mesaj = (err instanceof Error) ? err.message : String(err);
    App.toast(this.cevir(mesaj), 'hata');
  }
};
