import { t } from '../dil/i18n.js';
import { API } from '../api.js';
import { ikonlariGuncelle } from '../ikonlar.js';

export function islemKartiKur(app) {
  app.bindFAB = function () {
    document.getElementById('fab').addEventListener('click', () => {
      if (app.rol === 'izleyici') return;
      if (app.uyeler.length < 1) {
        app.toast(t('islem.henuzUyeYok'), 'hata');
        app.titresim(100);
        return;
      }
      app.modalAc('modal-tx');
    });
  };

  app.bindIslemModal = function () {
    document.getElementById('modal-tx-close').addEventListener('click', () => app.modalKapat('modal-tx'));
    document.getElementById('modal-tx').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) app.modalKapat('modal-tx');
    });

    document.querySelectorAll('.tx-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        app.islemTuru = tab.dataset.type;
        document.querySelectorAll('.tx-tab').forEach(t => {
          t.classList.remove('bg-brand', 'text-white');
          t.classList.add('text-gray-400');
        });
        tab.classList.add('bg-brand', 'text-white');
        tab.classList.remove('text-gray-400');
        document.getElementById('tx-receiver-group').classList.toggle('hidden', app.islemTuru !== 'transfer');
      });
    });

    document.getElementById('form-tx').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (app.rol === 'izleyici') return;
      const payerVal = document.getElementById('tx-payer').value;
      const kasaMi = payerVal === '__kasa__';
      const ortakModu = (app.ortaklar || []).length > 0;
      const data = {
        tur: app.islemTuru,
        odeyen_id: kasaMi ? app.uyeler[0]?.id : (ortakModu ? app.uyeler[0]?.id : payerVal),
        tutar: parseFloat(document.getElementById('tx-amount').value),
        aciklama: document.getElementById('tx-desc').value,
        tarih: document.getElementById('tx-date').value,
        kasa_mi: kasaMi
      };
      if (ortakModu && !kasaMi) data.odeyen_ortak_id = payerVal;

      if (app.islemTuru === 'transfer') {
        const receiverVal = document.getElementById('tx-receiver').value;
        const alanKasaMi = receiverVal === '__kasa__';
        if (kasaMi && alanKasaMi) { app.toast(t('islem.kasaKasaHata'), 'hata'); app.titresim(100); return; }
        data.alan_id = alanKasaMi ? app.uyeler[0]?.id : (ortakModu ? app.uyeler[0]?.id : receiverVal);
        data.alan_kasa_mi = alanKasaMi;
        if (ortakModu && !alanKasaMi) data.alan_ortak_id = receiverVal;
        if (!kasaMi && !alanKasaMi && data.odeyen_id === data.alan_id) {
          app.toast(t('islem.ayniKisiHata'), 'hata'); app.titresim(100); return;
        }
      }

      try {
        const sonuc = await API.addIslem(data);
        app.titresim();
        app.modalKapat('modal-tx');
        document.getElementById('form-tx').reset();
        app.varsayilanTarih();
        app.selectGuncelle();
        if (sonuc.kuyrukta) { app.toast(t('cevrimdisi.kuyrugaEklendi'), 'bilgi'); }
        else { app.toast(kasaMi ? t('islem.kasaEklendi') : app.islemTuru === 'transfer' ? t('islem.transferKaydedildi') : t('islem.harcamaEklendi'), 'basari'); }
        await app.yenile();
      } catch (err) { app.toast(t('hata.hataOneki', { mesaj: err.message }), 'hata'); app.titresim(100); }
    });
  };

  app.selectGuncelle = function () {
    const kullanici = API.getKullanici();
    const kullaniciId = kullanici?.id;
    const ortaklar = app.ortaklar || [];
    const kasaOption = app.sirketIsim ? `<option value="__kasa__">🏢 ${app.esc(app.sirketIsim)}</option>` : '';

    if (ortaklar.length > 0) {
      const mevcutUye = app.uyeler.find(u => u.kullanici_id === kullaniciId);
      const varsayilanOrtakId = mevcutUye?.ortak_id;
      const odeyenOptions = ortaklar.map(o => `<option value="${o.id}" ${o.id === varsayilanOrtakId ? 'selected' : ''}>${app.esc(o.isim)}</option>`).join('');
      document.getElementById('tx-payer').innerHTML = kasaOption + (odeyenOptions || `<option value="">${t('islem.uyeYok')}</option>`);
      const alanOptions = ortaklar.map(o => `<option value="${o.id}">${app.esc(o.isim)}</option>`).join('');
      document.getElementById('tx-receiver').innerHTML = kasaOption + (alanOptions || `<option value="">${t('islem.uyeYok')}</option>`);
    } else {
      const odeyenOptions = app.uyeler.map(u => `<option value="${u.id}" ${u.kullanici_id === kullaniciId ? 'selected' : ''}>${app.esc(u.isim)}</option>`).join('');
      document.getElementById('tx-payer').innerHTML = kasaOption + (odeyenOptions || `<option value="">${t('islem.uyeYok')}</option>`);
      const alanOptions = app.uyeler.map(u => `<option value="${u.id}">${app.esc(u.isim)}</option>`).join('');
      document.getElementById('tx-receiver').innerHTML = kasaOption + (alanOptions || `<option value="">${t('islem.uyeYok')}</option>`);
    }
  };

  app.islemListesiGoster = async function () {
    const list = document.getElementById('tx-list');
    const empty = document.getElementById('tx-empty');
    try {
      const islemler = await API.getIslemler();
      if (islemler.length === 0) { list.innerHTML = ''; empty.classList.remove('hidden'); return; }
      empty.classList.add('hidden');
      const uyeMap = {}; app.uyeler.forEach(u => { uyeMap[u.id] = u; });
      const ortakMap = {}; (app.ortaklar || []).forEach(o => { ortakMap[o.id] = o; });
      const izleyici = app.rol === 'izleyici';

      list.innerHTML = islemler.slice().reverse().map(i => {
        const odeyenOrtak = i.odeyen_ortak_id ? ortakMap[i.odeyen_ortak_id] : null;
        const odeyen = odeyenOrtak || uyeMap[i.odeyen_id] || { isim: '?', renk: '#999' };
        const transferMi = i.tur === 'transfer';
        const kasaMi = i.kasa_mi;
        const alanKasaMi = i.alan_kasa_mi;
        const alanOrtak = i.alan_ortak_id ? ortakMap[i.alan_ortak_id] : null;
        const alan = transferMi ? (alanOrtak || uyeMap[i.alan_id] || { isim: '?', renk: '#999' }) : null;
        let turBadge;
        if (kasaMi || alanKasaMi) turBadge = `<span class="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand">🏢 ${app.esc(app.sirketIsim)}</span>`;
        else if (transferMi) turBadge = `<span class="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand">${t('tur.transfer')}</span>`;
        else turBadge = `<span class="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">${t('tur.harcama')}</span>`;
        const odeyenIsim = kasaMi ? app.sirketIsim : odeyen.isim;
        const odeyenRenk = kasaMi ? '#6366f1' : odeyen.renk;
        const alanIsim = alanKasaMi ? app.sirketIsim : alan?.isim;
        const alanRenk = alanKasaMi ? '#6366f1' : alan?.renk;
        return `
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" style="background: ${odeyenRenk}"></div>
                <span class="font-medium text-sm text-gray-700">${app.esc(odeyenIsim)}</span>
                ${transferMi ? `
                  <i data-lucide="arrow-right" class="w-4 h-4 text-brand"></i>
                  <div class="w-3 h-3 rounded-full" style="background: ${alanRenk}"></div>
                  <span class="font-medium text-sm text-gray-700">${app.esc(alanIsim)}</span>
                ` : ''}
              </div>
              <span class="font-bold text-gray-900">${app.formatPara(i.tutar)} ₺</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                ${turBadge}
                ${i.aciklama ? `<span class="text-xs text-gray-400">${app.esc(i.aciklama)}</span>` : ''}
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-400">${i.tarih}</span>
                ${!izleyici ? `<button class="islem-sil p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition" data-id="${i.id}"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>` : ''}
              </div>
            </div>
          </div>`;
      }).join('');
      ikonlariGuncelle();

      if (!list._delegated) {
        list._delegated = true;
        list.addEventListener('click', async (e) => {
          const btn = e.target.closest('.islem-sil');
          if (!btn) return;
          app.islemSil(parseInt(btn.dataset.id));
        });
      }
    } catch (err) { console.error(err); }
  };

  app.islemSil = async function (id) {
    if (!confirm(t('islem.silOnay'))) return;
    try {
      await API.deleteIslem(id);
      app.titresim();
      app.toast(t('islem.silindi'), 'bilgi');
      await app.yenile();
      app.islemListesiGoster();
    } catch (err) { app.toast(t('hata.hataOneki', { mesaj: err.message }), 'hata'); }
  };
}
