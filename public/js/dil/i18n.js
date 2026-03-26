/**
 * AMØRT! i18n modülü
 * t('auth.girisBtn') => 'Giriş Yap'
 * t('ozet.altBilgi', {sayi: 3, tutar: '450'}) => '3 üye • Bireysel: 450 ₺'
 */
window.i18n = {
  dil: 'tr',

  init() {
    this.dil = localStorage.getItem('amort-dil') || 'tr';
    document.documentElement.lang = this.dil;
    this.uygula();
  },

  dilDegistir(dil) {
    this.dil = dil;
    localStorage.setItem('amort-dil', dil);
    document.documentElement.lang = dil;
    this.uygula();
  },

  /**
   * Çeviri getir: t('auth.girisBtn') veya t('ozet.altBilgi', {sayi: 3})
   */
  t(anahtar, params) {
    const paket = window.AMORT_DIL[this.dil];
    if (!paket) return anahtar;

    const parcalar = anahtar.split('.');
    let deger = paket;
    for (const p of parcalar) {
      deger = deger?.[p];
    }

    if (typeof deger !== 'string') return anahtar;

    if (params) {
      return deger.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? '');
    }
    return deger;
  },

  /**
   * DOM'daki data-i18n, data-i18n-placeholder, data-i18n-title öğelerini güncelle
   */
  uygula() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = this.t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = this.t(el.dataset.i18nTitle);
    });
  }
};

// Global kısayol
window.t = function(anahtar, params) {
  return window.i18n.t(anahtar, params);
};
