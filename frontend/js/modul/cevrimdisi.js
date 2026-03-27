import { t } from '../dil/i18n.js';

export const CevrimdisiKuyruk = {
  ANAHTAR: 'amort-sync-kuyruk',

  init(app, api) {
    this._app = app;
    this._api = api;

    window.addEventListener('online', () => {
      app.toast(t('cevrimdisi.tekrarBagli'), 'basari');
      this.gonder();
    });
    window.addEventListener('offline', () => {
      app.toast(t('cevrimdisi.cevrimdisi'), 'bilgi');
    });
    if (navigator.onLine && this.kuyrukAl().length > 0) {
      this.gonder();
    }
  },

  kuyrukAl() {
    try { return JSON.parse(localStorage.getItem(this.ANAHTAR) || '[]'); }
    catch { return []; }
  },
  kuyrukKaydet(kuyruk) { localStorage.setItem(this.ANAHTAR, JSON.stringify(kuyruk)); },

  ekle(path, options) {
    const kuyruk = this.kuyrukAl();
    kuyruk.push({ path, options, zaman: Date.now() });
    this.kuyrukKaydet(kuyruk);
  },

  async gonder() {
    const kuyruk = this.kuyrukAl();
    if (kuyruk.length === 0) return;

    let basarili = 0, basarisiz = 0;
    const kalanlar = [];

    for (const istek of kuyruk) {
      try {
        await this._api.request(istek.path, istek.options);
        basarili++;
      } catch (err) {
        if (!navigator.onLine) { kalanlar.push(istek); }
        else { basarisiz++; console.warn('Sync hatası:', istek.path, err.message); }
      }
    }
    this.kuyrukKaydet(kalanlar);

    if (basarili > 0) {
      this._app.toast(t('cevrimdisi.senkronEdildi', { sayi: basarili }), 'basari');
      if (typeof this._app.yenile === 'function') this._app.yenile();
    }
    if (basarisiz > 0) {
      this._app.toast(t('cevrimdisi.senkronHatasi', { sayi: basarisiz }), 'hata');
    }
  },

  bekleyenSayisi() { return this.kuyrukAl().length; }
};
