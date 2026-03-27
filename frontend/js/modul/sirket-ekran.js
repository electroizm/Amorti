import { t } from '../dil/i18n.js';
import { API } from '../api.js';
import { ikonlariGuncelle } from '../ikonlar.js';

export function sirketEkranKur(app) {
  app.bindSirketSecici = function () {
    this.sirketleriYukle();
    document.getElementById('form-sirket').addEventListener('submit', async (e) => {
      e.preventDefault();
      const isim = document.getElementById('sirket-isim').value.trim();
      if (!isim) return;
      try {
        const sirket = await API.sirketOlustur(isim);
        app.toast(t('sirket.olusturuldu', { isim }), 'basari');
        document.getElementById('sirket-isim').value = '';
        API.setSirketId(sirket.id);
        app.ekranGoster('app');
        app.bindApp();
        await app.yenile();
      } catch (err) { app.toast(err.message, 'hata'); }
    });
    document.getElementById('btn-cikis-sirket').addEventListener('click', async () => {
      await API.cikis();
      window.location.reload();
    });
  };

  app.sirketleriYukle = async function () {
    try {
      const [sirketler, davetler] = await Promise.all([API.getSirketler(), API.bekleyenDavetler()]);
      app.sirketSayisi = sirketler.length;
      const container = document.getElementById('sirket-listesi');

      if (sirketler.length === 1 && davetler.length === 0) {
        API.setSirketId(sirketler[0].id);
        app.ekranGoster('app');
        app.bindApp();
        await app.yenile();
        return;
      }
      app.tumSirketler = sirketler;

      if (sirketler.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-400 text-sm py-4">${t('sirket.henuzYok')}</p>`;
      } else {
        container.innerHTML = sirketler.map(s => `
          <div class="relative">
            <button class="sirket-sec w-full bg-white rounded-xl p-4 text-left shadow-sm border border-gray-100 hover:border-brand transition pr-10" data-id="${s.id}">
              <p class="font-semibold text-gray-900">${app.esc(s.isim)}</p>
              <p class="text-xs text-gray-400 mt-0.5">${t('ayarlar.rol', { rol: app.rolGoster(s.rol) })}</p>
            </button>
            ${s.tip === 'bireysel' ? `
              <button class="sirket-gizle absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition" data-id="${s.id}">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            ` : ''}
          </div>
        `).join('');
        ikonlariGuncelle();

        if (!container._delegated) {
          container._delegated = true;
          container.addEventListener('click', async (e) => {
            const gizleBtn = e.target.closest('.sirket-gizle');
            if (gizleBtn) {
              e.stopPropagation();
              if (!confirm(t('sirket.gizleOnay'))) return;
              try {
                await API.sirketGizle(gizleBtn.dataset.id);
                app.toast(t('sirket.gizlendi'), 'bilgi');
                app.sirketleriYukle();
              } catch (err) { app.toast(err.message, 'hata'); }
              return;
            }
            const btn = e.target.closest('.sirket-sec');
            if (!btn) return;
            API.setSirketId(btn.dataset.id);
            app.ekranGoster('app');
            app.bindApp();
            await app.yenile();
          });
        }
      }

      const davetContainer = document.getElementById('bekleyen-davetler');
      const davetListesi = document.getElementById('davet-listesi-bekleyen');
      if (davetler.length > 0) {
        davetContainer.classList.remove('hidden');
        davetListesi.innerHTML = davetler.map(d => `
          <div class="bg-white rounded-xl p-3 shadow-sm border border-brand/20 flex items-center justify-between">
            <div>
              <p class="font-medium text-sm text-gray-900">${app.esc(d.sirketler?.isim || '?')}</p>
              <p class="text-xs text-gray-400">${t('ayarlar.rol', { rol: app.rolGoster(d.rol) })}</p>
            </div>
            <div class="flex gap-2">
              <button class="davet-kabul px-3 py-1.5 bg-brand text-white text-xs rounded-lg font-semibold" data-id="${d.id}">${t('sirket.davetKabulBtn')}</button>
              <button class="davet-red px-3 py-1.5 bg-gray-100 text-gray-500 text-xs rounded-lg font-semibold" data-id="${d.id}">${t('sirket.davetRedBtn')}</button>
            </div>
          </div>
        `).join('');
        if (!davetListesi._delegated) {
          davetListesi._delegated = true;
          davetListesi.addEventListener('click', async (e) => {
            const kabulBtn = e.target.closest('.davet-kabul');
            const redBtn = e.target.closest('.davet-red');
            if (kabulBtn) {
              try { await API.davetKabul(kabulBtn.dataset.id); app.toast(t('sirket.davetKabulEdildi'), 'basari'); app.sirketleriYukle(); }
              catch (err) { app.toast(err.message, 'hata'); }
            } else if (redBtn) {
              try { await API.davetRed(redBtn.dataset.id); app.toast(t('sirket.davetReddedildi'), 'bilgi'); app.sirketleriYukle(); }
              catch (err) { app.toast(err.message, 'hata'); }
            }
          });
        }
      } else { davetContainer.classList.add('hidden'); }
    } catch (err) {
      console.error('sirketleriYukle hatasi:', err);
      app.toast(t('hata.veriYuklenemedi', { mesaj: err.message }), 'hata');
    }
  };
}
