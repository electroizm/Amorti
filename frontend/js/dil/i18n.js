import tr from './tr.js';
import en from './en.js';

const DIL_PAKETI = { tr, en };

export const i18n = {
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

  t(anahtar, params) {
    const paket = DIL_PAKETI[this.dil];
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

export function t(anahtar, params) {
  return i18n.t(anahtar, params);
}
