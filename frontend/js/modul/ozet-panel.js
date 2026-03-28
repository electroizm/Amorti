import { t } from '../dil/i18n.js';
import { ikonlariGuncelle } from '../ikonlar.js';

function bas(isim) {
  return (isim || '?').charAt(0).toUpperCase();
}

export function ozetPanelKur(app) {
  app.ortakKartlariGoster = function (ozet) {
    const container = document.getElementById('partner-cards');
    const list = ozet.ortaklar?.length > 0 ? ozet.ortaklar : ozet.uyeler;
    if (!list?.length) { container.innerHTML = ''; return; }

    const isOrtak = (ozet.ortaklar?.length ?? 0) > 0;

    container.innerHTML = list.map(entity => {
      const harcanan = isOrtak
        ? (ozet.ortakHarcamalar || {})[entity.id] || 0
        : ozet.harcamalar[entity.id] || 0;
      const bakiye = ozet.bakiyeler[entity.id] || 0;
      const bakiyeClass = bakiye > 0 ? 'partner-badge-alacak' : bakiye < 0 ? 'partner-badge-borc' : 'partner-badge-esit';
      const bakiyeLabel = bakiye > 0 ? t('bakiye.alacakli') : bakiye < 0 ? t('bakiye.borclu') : t('bakiye.esit');
      const payStr = isOrtak && entity.pay != null ? `<span class="partner-pay">%${entity.pay}</span>` : '';

      return `
        <div class="partner-card">
          <div class="partner-card-top">
            <div class="amort-avatar amort-avatar-lg" style="background:${entity.renk}">${bas(entity.isim)}</div>
            ${payStr}
          </div>
          <p class="partner-name">${app.esc(entity.isim)}</p>
          <p class="partner-amount">${app.formatPara(harcanan)} <span class="partner-tl">₺</span></p>
          <div class="partner-badge ${bakiyeClass}">
            ${bakiye !== 0 ? (bakiye > 0 ? '+' : '') + app.formatPara(Math.abs(bakiye)) + ' ₺' : '—'}
            <span>${bakiyeLabel}</span>
          </div>
        </div>`;
    }).join('');
  };

  app.borcBolumuGoster = function (ozet) {
    const section = document.getElementById('debt-section');
    const container = document.getElementById('debt-transfers');
    if (!ozet.onerilen_transferler.length) { section.classList.add('hidden'); return; }
    section.classList.remove('hidden');

    const ortaklar = ozet.ortaklar || [];
    const entityMap = {};
    if (ortaklar.length > 0) { ortaklar.forEach(o => { entityMap[o.id] = o; }); }
    else { ozet.uyeler.forEach(u => { entityMap[u.id] = u; }); }

    container.innerHTML = ozet.onerilen_transferler.map(tr => {
      const kimden = entityMap[tr.kimden];
      const kime = entityMap[tr.kime];
      if (!kimden || !kime) return '';
      return `
        <div class="debt-row">
          <div class="debt-entity">
            <div class="amort-avatar amort-avatar-sm" style="background:${kimden.renk}">${bas(kimden.isim)}</div>
            <span class="debt-name">${app.esc(kimden.isim)}</span>
          </div>
          <div class="debt-arrow transfer-arrow">
            <i data-lucide="arrow-right" class="w-4 h-4 text-brand"></i>
          </div>
          <div class="debt-entity">
            <div class="amort-avatar amort-avatar-sm" style="background:${kime.renk}">${bas(kime.isim)}</div>
            <span class="debt-name">${app.esc(kime.isim)}</span>
          </div>
          <span class="debt-amount">${app.formatPara(tr.tutar)} ₺</span>
        </div>`;
    }).join('');
    ikonlariGuncelle();
  };
}
