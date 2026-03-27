/**
 * AMØRT! Özet Panel Modülü
 * Ortak kartları ve borç önerileri render
 */
Object.assign(App, {
  ortakKartlariGoster(ozet) {
    const container = document.getElementById('partner-cards');
    const ortaklar = ozet.ortaklar || [];

    if (ortaklar.length > 0) {
      // Ortak bazlı kartlar
      container.innerHTML = ortaklar.map(o => {
        const harcanan = (ozet.ortakHarcamalar || {})[o.id] || 0;
        const bakiye = ozet.bakiyeler[o.id] || 0;
        const bakiyeClass = bakiye > 0 ? 'text-emerald-600' : bakiye < 0 ? 'text-red-500' : 'text-gray-400';
        const bakiyeLabel = bakiye > 0 ? t('bakiye.alacakli') : bakiye < 0 ? t('bakiye.borclu') : t('bakiye.esit');

        return `
          <div class="bg-white rounded-xl p-4 border-l-4 shadow-sm" style="border-color: ${o.renk}">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-3 h-3 rounded-full" style="background: ${o.renk}"></div>
              <span class="font-semibold text-sm text-gray-900">${App.esc(o.isim)}</span>
              ${o.pay != null ? `<span class="text-xs text-gray-400">%${o.pay}</span>` : ''}
            </div>
            <p class="text-lg font-bold text-gray-900">${App.formatPara(harcanan)} ₺</p>
            <p class="text-xs ${bakiyeClass}">${bakiye > 0 ? '+' : ''}${App.formatPara(bakiye)} ₺ ${bakiyeLabel}</p>
          </div>
        `;
      }).join('');
    } else if (ozet.uyeler.length > 0) {
      // Üye bazlı kartlar (geriye uyumlu)
      container.innerHTML = ozet.uyeler.map(u => {
        const harcanan = ozet.harcamalar[u.id] || 0;
        const bakiye = ozet.bakiyeler[u.id] || 0;
        const bakiyeClass = bakiye > 0 ? 'text-emerald-600' : bakiye < 0 ? 'text-red-500' : 'text-gray-400';
        const bakiyeLabel = bakiye > 0 ? t('bakiye.alacakli') : bakiye < 0 ? t('bakiye.borclu') : t('bakiye.esit');

        return `
          <div class="bg-white rounded-xl p-4 border-l-4 shadow-sm" style="border-color: ${u.renk}">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-3 h-3 rounded-full" style="background: ${u.renk}"></div>
              <span class="font-semibold text-sm text-gray-900">${App.esc(u.isim)}</span>
            </div>
            <p class="text-lg font-bold text-gray-900">${App.formatPara(harcanan)} ₺</p>
            <p class="text-xs ${bakiyeClass}">${bakiye > 0 ? '+' : ''}${App.formatPara(bakiye)} ₺ ${bakiyeLabel}</p>
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = '';
    }
  },

  borcBolumuGoster(ozet) {
    const section = document.getElementById('debt-section');
    const container = document.getElementById('debt-transfers');
    const ortaklar = ozet.ortaklar || [];

    if (ozet.onerilen_transferler.length === 0) { section.classList.add('hidden'); return; }
    section.classList.remove('hidden');

    // Ortaklar varsa ortak map, yoksa üye map
    const entityMap = {};
    if (ortaklar.length > 0) {
      ortaklar.forEach(o => { entityMap[o.id] = o; });
    } else {
      ozet.uyeler.forEach(u => { entityMap[u.id] = u; });
    }

    container.innerHTML = ozet.onerilen_transferler.map(tr => {
      const kimden = entityMap[tr.kimden];
      const kime = entityMap[tr.kime];
      if (!kimden || !kime) return '';
      return `
        <div class="transfer-card rounded-xl p-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" style="background: ${kimden.renk}"></div>
            <span class="font-medium text-sm text-gray-700">${App.esc(kimden.isim)}</span>
            <div class="transfer-arrow w-6 h-5 flex items-center justify-center">
              <i data-lucide="arrow-right" class="w-4 h-4 text-brand"></i>
            </div>
            <div class="w-3 h-3 rounded-full" style="background: ${kime.renk}"></div>
            <span class="font-medium text-sm text-gray-700">${App.esc(kime.isim)}</span>
          </div>
          <span class="font-bold text-brand">${App.formatPara(tr.tutar)} ₺</span>
        </div>
      `;
    }).join('');
    App.ikonlariGuncelle();
  }
});
