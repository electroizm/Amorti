/**
 * AMØRT! Çevrimdışı Kuyruk Modülü
 * Offline iken yapılan istekleri localStorage'da biriktirir,
 * çevrimiçi olunca sırayla gönderir.
 */
window.CevrimdisiKuyruk = {
  ANAHTAR: 'amort-sync-kuyruk',

  init() {
    // Çevrimiçi olunca kuyruğu gönder
    window.addEventListener('online', () => {
      App.toast(t('cevrimdisi.tekrarBagli'), 'basari');
      this.gonder();
    });

    window.addEventListener('offline', () => {
      App.toast(t('cevrimdisi.cevrimdisi'), 'bilgi');
    });

    // Sayfa açılışında kuyruk varsa gönder
    if (navigator.onLine && this.kuyrukAl().length > 0) {
      this.gonder();
    }
  },

  /**
   * Kuyruğu localStorage'dan oku
   */
  kuyrukAl() {
    try {
      return JSON.parse(localStorage.getItem(this.ANAHTAR) || '[]');
    } catch { return []; }
  },

  /**
   * Kuyruğu localStorage'a yaz
   */
  kuyrukKaydet(kuyruk) {
    localStorage.setItem(this.ANAHTAR, JSON.stringify(kuyruk));
  },

  /**
   * İstek kuyruğa ekle
   * @param {string} path - API yolu (/islemler vb.)
   * @param {object} options - {method, body}
   */
  ekle(path, options) {
    const kuyruk = this.kuyrukAl();
    kuyruk.push({
      path,
      options,
      zaman: Date.now()
    });
    this.kuyrukKaydet(kuyruk);
  },

  /**
   * Kuyruktaki istekleri sırayla gönder
   */
  async gonder() {
    const kuyruk = this.kuyrukAl();
    if (kuyruk.length === 0) return;

    let basarili = 0;
    let basarisiz = 0;
    const kalanlar = [];

    for (const istek of kuyruk) {
      try {
        await API.request(istek.path, istek.options);
        basarili++;
      } catch (err) {
        // Network hatası ise kuyruğa geri koy
        if (!navigator.onLine) {
          kalanlar.push(istek);
        } else {
          // Gerçek hata (validation vb.) — kuyruğdan çıkar
          basarisiz++;
          console.warn('Sync hatası:', istek.path, err.message);
        }
      }
    }

    this.kuyrukKaydet(kalanlar);

    if (basarili > 0) {
      App.toast(t('cevrimdisi.senkronEdildi', { sayi: basarili }), 'basari');
      // Veriyi yenile
      if (typeof App.yenile === 'function') App.yenile();
    }
    if (basarisiz > 0) {
      App.toast(t('cevrimdisi.senkronHatasi', { sayi: basarisiz }), 'hata');
    }
  },

  /**
   * Kuyrukta bekleyen istek sayısı
   */
  bekleyenSayisi() {
    return this.kuyrukAl().length;
  }
};
