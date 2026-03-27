/**
 * AMØRT! Çöp Kutusu Modülü (ES Module)
 * Admin-only: silinmiş işlem ve üyeleri listele + geri al
 */
import { t } from '../dil/i18n.js';
import { API } from '../api.js';

export function copKutusuKur(app) {

  app.copKutusuYukle = async function () {
    if (app.rol !== 'yonetici') {
      document.getElementById('cop-kutusu-section').classList.add('hidden');
      return;
    }

    const section = document.getElementById('cop-kutusu-section');
    const islemContainer = document.getElementById('cop-islemler');
    const uyeContainer = document.getElementById('cop-uyeler');
    const bosEl = document.getElementById('cop-bos');

    try {
      const [islemler, uyeler] = await Promise.all([
        API.silinmisIslemler(),
        API.silinmisUyeler()
      ]);

      const toplamSilinmis = islemler.length + uyeler.length;

      if (toplamSilinmis === 0) {
        section.classList.remove('hidden');
        islemContainer.innerHTML = '';
        uyeContainer.innerHTML = '';
        bosEl.classList.remove('hidden');
        return;
      }

      section.classList.remove('hidden');
      bosEl.classList.add('hidden');

      // Silinmiş işlemler
      if (islemler.length > 0) {
        islemContainer.innerHTML =
          `<p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">${t('cop.islemler')}</p>` +
          islemler.map(i => `
            <div class="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div>
                <span class="text-sm text-gray-600">${app.esc(i.aciklama || i.tur)}</span>
                <span class="text-xs text-gray-400 ml-2">${app.formatPara(i.tutar)} ₺</span>
                <span class="text-xs text-gray-400 ml-1">${i.tarih}</span>
              </div>
              <button class="cop-islem-geri-al px-3 py-1 bg-brand/10 text-brand text-xs rounded-lg font-semibold hover:bg-brand/20 transition" data-id="${i.id}">${t('cop.geriAlBtn')}</button>
            </div>
          `).join('');

        if (!islemContainer._delegated) {
          islemContainer._delegated = true;
          islemContainer.addEventListener('click', async (e) => {
            const btn = e.target.closest('.cop-islem-geri-al');
            if (!btn) return;
            try {
              await API.islemGeriAl(parseInt(btn.dataset.id));
              app.toast(t('cop.geriAlindi'), 'basari');
              app.copKutusuYukle();
              app.yenile();
            } catch (err) { app.toast(err.message, 'hata'); }
          });
        }
      } else {
        islemContainer.innerHTML = '';
      }

      // Silinmiş üyeler
      if (uyeler.length > 0) {
        uyeContainer.innerHTML =
          `<p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">${t('cop.uyeler')}</p>` +
          uyeler.map(u => `
            <div class="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full" style="background: ${u.renk}"></div>
                <span class="text-sm text-gray-600">${app.esc(u.isim)}</span>
              </div>
              <button class="cop-uye-geri-al px-3 py-1 bg-brand/10 text-brand text-xs rounded-lg font-semibold hover:bg-brand/20 transition" data-id="${u.id}">${t('cop.geriAlBtn')}</button>
            </div>
          `).join('');

        if (!uyeContainer._delegated) {
          uyeContainer._delegated = true;
          uyeContainer.addEventListener('click', async (e) => {
            const btn = e.target.closest('.cop-uye-geri-al');
            if (!btn) return;
            try {
              await API.uyeGeriAl(btn.dataset.id);
              app.toast(t('cop.geriAlindi'), 'basari');
              app.copKutusuYukle();
              app.yenile();
            } catch (err) { app.toast(err.message, 'hata'); }
          });
        }
      } else {
        uyeContainer.innerHTML = '';
      }
    } catch (err) {
      console.error('Çöp kutusu yüklenemedi:', err);
    }
  };
}
