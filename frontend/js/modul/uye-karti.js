import { t } from '../dil/i18n.js';
import { API } from '../api.js';
import { ikonlariGuncelle } from '../ikonlar.js';

export function uyeKartiKur(app) {
  app._partnerTab = 'uyeler';

  app.bindDavetModal = function () {
    document.getElementById('btn-davet-gonder').addEventListener('click', () => {
      app.modalAc('modal-davet');
      // Ortaklar sekmesinden açılıyorsa pay alanını vurgula
      const payGroup = document.getElementById('davet-pay-group');
      if (payGroup) {
        const ortakTab = app._partnerTab === 'ortaklar';
        payGroup.classList.toggle('ring-2', ortakTab);
        payGroup.classList.toggle('ring-brand', ortakTab);
        payGroup.classList.toggle('ring-offset-2', ortakTab);
        payGroup.classList.toggle('rounded-xl', ortakTab);
        if (ortakTab) document.getElementById('davet-pay').focus();
      }
    });
    const temizleDavetVurgu = () => {
      const g = document.getElementById('davet-pay-group');
      if (g) g.classList.remove('ring-2', 'ring-brand', 'ring-offset-2', 'rounded-xl');
    };
    document.getElementById('modal-davet-close').addEventListener('click', () => { temizleDavetVurgu(); app.modalKapat('modal-davet'); });
    document.getElementById('modal-davet').addEventListener('click', (e) => { if (e.target === e.currentTarget) { temizleDavetVurgu(); app.modalKapat('modal-davet'); } });

    document.getElementById('form-davet').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const payVal = document.getElementById('davet-pay')?.value;
        const pay = payVal ? parseFloat(payVal) : null;
        await API.davetGonder(document.getElementById('davet-eposta').value, document.getElementById('davet-rol').value, pay);
        app.titresim(); app.modalKapat('modal-davet'); document.getElementById('form-davet').reset();
        app.toast(t('davet.gonderildi'), 'basari');
        if (app.mevcutSayfa === 'partners') app.uyeListesiGoster();
      } catch (err) { app.toast(err.message, 'hata'); app.titresim(100); }
    });

    document.querySelectorAll('.partner-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        app._partnerTab = tab.dataset.tab;
        document.querySelectorAll('.partner-tab').forEach(t => { t.classList.remove('bg-brand', 'text-white'); t.classList.add('text-gray-400'); });
        tab.classList.add('bg-brand', 'text-white'); tab.classList.remove('text-gray-400');
        document.getElementById('tab-uyeler').classList.toggle('hidden', app._partnerTab !== 'uyeler');
        document.getElementById('tab-ortaklar').classList.toggle('hidden', app._partnerTab !== 'ortaklar');
        // Davet Et butonu her iki sekmede yönetici için görünür
        document.getElementById('btn-davet-gonder').classList.toggle('hidden', app.rol !== 'yonetici');
        if (app._partnerTab === 'ortaklar') app.ortakListesiGoster();
      });
    });

    // Ortak düzenle modal
    document.getElementById('modal-ortak-duzenle-close').addEventListener('click', () => app.modalKapat('modal-ortak-duzenle'));
    document.getElementById('modal-ortak-duzenle').addEventListener('click', (e) => { if (e.target === e.currentTarget) app.modalKapat('modal-ortak-duzenle'); });
    document.getElementById('form-ortak-duzenle').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('ortak-duzenle-id').value;
      const isim = document.getElementById('ortak-duzenle-isim').value.trim();
      const renk = document.getElementById('ortak-duzenle-renk').value;
      const payVal = document.getElementById('ortak-duzenle-pay').value;
      const pay = payVal ? parseFloat(payVal) : null;
      const btn = e.target.querySelector('[type="submit"]');
      btn.disabled = true;
      try {
        await API.ortakGuncelle(id, { isim, renk, pay });
        app.titresim(); app.toast(t('ortak.guncellendi'), 'basari');
        app.modalKapat('modal-ortak-duzenle');
        app.ortakListesiGoster(); await app.yenile();
      } catch (err) { app.toast(err.message, 'hata'); }
      finally { btn.disabled = false; }
    });
  };

  app.uyeListesiGoster = async function () {
    const list = document.getElementById('partner-list');
    const empty = document.getElementById('partner-empty');
    const yonetici = app.rol === 'yonetici';
    const ortaklar = app.ortaklar || [];
    try {
      const uyeler = await API.getUyeler();
      if (uyeler.length === 0) { list.innerHTML = ''; empty.classList.remove('hidden'); }
      else {
        empty.classList.add('hidden');
        const ortakOptions = ortaklar.length > 0 ? `<option value="">${t('uye.ortakYok')}</option>` + ortaklar.map(o => `<option value="${o.id}">${app.esc(o.isim)}</option>`).join('') : '';
        list.innerHTML = uyeler.map(u => `
          <div class="uye-row">
            <div class="flex items-center gap-3">
              <div class="amort-avatar" style="background:${u.renk}">${(u.isim || '?').charAt(0).toUpperCase()}</div>
              <div><p class="font-semibold text-sm text-gray-900">${app.esc(u.isim)}</p><p class="text-xs text-brand/70 font-medium">${app.rolGoster(u.rol)}</p></div>
            </div>
            ${yonetici ? `
              <div class="flex gap-1 items-center">
                ${ortaklar.length > 0 ? `<select class="ortak-ata text-xs border border-gray-200 rounded-lg px-2 py-1" data-id="${u.id}">${ortakOptions.replace(`value="${u.ortak_id}"`, `value="${u.ortak_id}" selected`)}</select>` : ''}
                <select class="rol-degistir text-xs border border-gray-200 rounded-lg px-2 py-1" data-id="${u.id}">
                  <option value="yonetici" ${u.rol === 'yonetici' ? 'selected' : ''}>${t('rol.yonetici')}</option>
                  <option value="uye" ${u.rol === 'uye' ? 'selected' : ''}>${t('rol.uye')}</option>
                  <option value="izleyici" ${u.rol === 'izleyici' ? 'selected' : ''}>${t('rol.izleyici')}</option>
                </select>
                <button class="uye-sil p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition" data-id="${u.id}" data-isim="${app.esc(u.isim)}">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>` : ''}
          </div>
          `).join('');
        ikonlariGuncelle();

        if (!list._delegated) {
          list._delegated = true;
          list.addEventListener('change', async (e) => {
            const sel = e.target.closest('.rol-degistir');
            if (sel) { try { await API.uyeRolDegistir(sel.dataset.id, sel.value); app.toast(t('uye.rolGuncellendi'), 'basari'); } catch (err) { app.toast(err.message, 'hata'); app.uyeListesiGoster(); } return; }
            const ortakSel = e.target.closest('.ortak-ata');
            if (ortakSel) { try { await API.uyeGuncelle(ortakSel.dataset.id, { ortak_id: ortakSel.value || null }); app.toast(t('uye.rolGuncellendi'), 'basari'); } catch (err) { app.toast(err.message, 'hata'); app.uyeListesiGoster(); } }
          });
          list.addEventListener('click', async (e) => {
            const btn = e.target.closest('.uye-sil'); if (!btn) return;
            if (!confirm(t('uye.silOnay', { isim: btn.dataset.isim }))) return;
            try { await API.uyeSil(btn.dataset.id); app.titresim(); app.toast(t('uye.cikarildi'), 'bilgi'); await app.yenile(); app.uyeListesiGoster(); }
            catch (err) { app.toast(err.message, 'hata'); }
          });
        }
      }
      if (yonetici) {
        try {
          const davetler = await API.davetListele();
          const section = document.getElementById('davet-section');
          const listEl = document.getElementById('davet-listesi');
          if (davetler.length > 0) {
            section.classList.remove('hidden');
            listEl.innerHTML = davetler.map(d => {
              const durumRenk = d.durum === 'bekliyor' ? 'text-yellow-600 bg-yellow-50' : d.durum === 'kabul' ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50';
              return `<div class="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between"><div><p class="text-sm font-medium text-gray-700">${app.esc(d.eposta)}</p><p class="text-xs text-gray-400">${t('ayarlar.rol', { rol: app.rolGoster(d.rol) })}</p></div><span class="text-xs px-2 py-0.5 rounded-full font-medium ${durumRenk}">${app.durumGoster(d.durum)}</span></div>`;
            }).join('');
          } else { section.classList.add('hidden'); }
        } catch (err) { console.error(err); }
      }
    } catch (err) { console.error(err); }
  };

  app.ortakListesiGoster = async function () {
    const list = document.getElementById('ortak-list');
    const empty = document.getElementById('ortak-empty');
    const yonetici = app.rol === 'yonetici';
    try {
      const ortaklar = await API.getOrtaklar(); app.ortaklar = ortaklar;
      if (ortaklar.length === 0) { list.innerHTML = ''; empty.classList.remove('hidden'); return; }

      empty.classList.add('hidden');
      list.innerHTML = ortaklar.map(o => `
        <div class="ortak-wrapper" data-id="${o.id}">
          <div class="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
            <div class="flex items-center gap-3">
              <div class="amort-avatar" style="background:${o.renk}">${(o.isim || '?').charAt(0).toUpperCase()}</div>
              <div>
                <p class="font-semibold text-sm text-gray-900">${app.esc(o.isim)}</p>
                <p class="text-xs text-gray-400">${o.pay != null ? `%${o.pay}` : '— kalan pay'}</p>
              </div>
            </div>
            ${yonetici ? `<div class="flex gap-1">
              <button class="ortak-duzenle p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition" data-id="${o.id}" data-isim="${app.esc(o.isim)}" data-renk="${o.renk}" data-pay="${o.pay != null ? o.pay : ''}">
                <i data-lucide="pencil" class="w-4 h-4"></i>
              </button>
              <button class="ortak-sil p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition" data-id="${o.id}" data-isim="${app.esc(o.isim)}">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>` : ''}
          </div>
          <div class="ortak-sil-panel hidden"></div>
        </div>`).join('');
      ikonlariGuncelle();

      if (!list._ortakDelegated) {
        list._ortakDelegated = true;
        list.addEventListener('click', async (e) => {
          // Düzenle → modal aç
          const duzenleBtn = e.target.closest('.ortak-duzenle');
          if (duzenleBtn) {
            document.getElementById('ortak-duzenle-id').value = duzenleBtn.dataset.id;
            document.getElementById('ortak-duzenle-isim').value = duzenleBtn.dataset.isim;
            document.getElementById('ortak-duzenle-renk').value = duzenleBtn.dataset.renk || '#6366f1';
            document.getElementById('ortak-duzenle-pay').value = duzenleBtn.dataset.pay || '';
            app.modalAc('modal-ortak-duzenle');
            return;
          }

          // Sil → inline onay paneli
          const silBtn = e.target.closest('.ortak-sil');
          if (silBtn) {
            const id = silBtn.dataset.id;
            const wrapper = list.querySelector(`.ortak-wrapper[data-id="${id}"]`);
            const panel = wrapper.querySelector('.ortak-sil-panel');
            if (!panel.classList.contains('hidden')) { panel.classList.add('hidden'); return; }
            list.querySelectorAll('.ortak-sil-panel').forEach(p => p.classList.add('hidden'));
            const digerOrtaklar = app.ortaklar.filter(o => o.id !== id);
            if (digerOrtaklar.length === 0) {
              if (!confirm(t('ortak.silOnay', { isim: silBtn.dataset.isim }))) return;
              try { await API.ortakSil(id); app.titresim(); app.toast(t('ortak.silindi'), 'bilgi'); app.ortakListesiGoster(); await app.yenile(); }
              catch (err) { app.toast(err.message, 'hata'); }
              return;
            }
            panel.innerHTML = `<div class="bg-red-50 rounded-b-xl p-3 border border-t-0 border-red-100 space-y-2">
              <p class="text-xs text-red-600 font-medium">${t('ortak.devirSecim')}</p>
              <select class="ortak-devir-select w-full text-sm border border-red-200 rounded-lg px-3 py-1.5">${digerOrtaklar.map(o => `<option value="${o.id}">${app.esc(o.isim)}</option>`).join('')}</select>
              <div class="flex gap-2">
                <button class="ortak-sil-onayla flex-1 py-1.5 bg-red-500 text-white text-xs rounded-lg font-semibold" data-id="${id}">${t('ortak.silVeDevret')}</button>
                <button class="ortak-sil-iptal flex-1 py-1.5 bg-gray-100 text-gray-500 text-xs rounded-lg font-semibold">${t('ortak.iptalBtn')}</button>
              </div></div>`;
            panel.classList.remove('hidden');
            return;
          }

          if (e.target.closest('.ortak-sil-iptal')) { e.target.closest('.ortak-sil-panel').classList.add('hidden'); return; }

          const onaylaBtn = e.target.closest('.ortak-sil-onayla');
          if (onaylaBtn) {
            const id = onaylaBtn.dataset.id;
            const wrapper = list.querySelector(`.ortak-wrapper[data-id="${id}"]`);
            const hedefId = wrapper.querySelector('.ortak-devir-select').value;
            try { await API.ortakSil(id, hedefId); app.titresim(); app.toast(t('ortak.silindi'), 'bilgi'); app.ortakListesiGoster(); await app.yenile(); }
            catch (err) { app.toast(err.message, 'hata'); }
          }
        });
      }
    } catch (err) { console.error(err); }
  };
}
