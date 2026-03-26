/**
 * AMØRT! İşlem Kartı Modülü
 * İşlem listesi, modal, FAB, select güncelleme
 */
Object.assign(App, {
  bindFAB() {
    document.getElementById('fab').addEventListener('click', () => {
      if (App.uyeler.length < 1) {
        App.toast(t('islem.henuzUyeYok'), 'hata');
        App.titresim(100);
        return;
      }
      App.modalAc('modal-tx');
    });
  },

  bindIslemModal() {
    document.getElementById('modal-tx-close').addEventListener('click', () => App.modalKapat('modal-tx'));
    document.getElementById('modal-tx').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) App.modalKapat('modal-tx');
    });

    document.querySelectorAll('.tx-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        App.islemTuru = tab.dataset.type;
        document.querySelectorAll('.tx-tab').forEach(t => {
          t.classList.remove('bg-brand', 'text-white');
          t.classList.add('text-gray-400');
        });
        tab.classList.add('bg-brand', 'text-white');
        tab.classList.remove('text-gray-400');

        const receiverGroup = document.getElementById('tx-receiver-group');
        receiverGroup.classList.toggle('hidden', App.islemTuru !== 'transfer');

        const kasaOpt = document.querySelector('#tx-payer option[value="__kasa__"]');
        if (kasaOpt) kasaOpt.style.display = App.islemTuru === 'transfer' ? 'none' : '';
      });
    });

    document.getElementById('form-tx').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payerVal = document.getElementById('tx-payer').value;
      const kasaMi = payerVal === '__kasa__';

      const data = {
        tur: App.islemTuru,
        odeyen_id: kasaMi ? App.uyeler[0]?.id : payerVal,
        tutar: parseFloat(document.getElementById('tx-amount').value),
        aciklama: document.getElementById('tx-desc').value,
        tarih: document.getElementById('tx-date').value,
        kasa_mi: kasaMi
      };

      if (App.islemTuru === 'transfer') {
        data.alan_id = document.getElementById('tx-receiver').value;
        if (data.odeyen_id === data.alan_id) {
          App.toast(t('islem.ayniKisiHata'), 'hata');
          App.titresim(100);
          return;
        }
      }

      try {
        const sonuc = await API.addIslem(data);
        App.titresim();
        App.modalKapat('modal-tx');
        document.getElementById('form-tx').reset();
        App.varsayilanTarih();
        App.selectGuncelle();
        if (sonuc.kuyrukta) {
          App.toast(t('cevrimdisi.kuyrugaEklendi'), 'bilgi');
        } else {
          App.toast(kasaMi ? t('islem.kasaEklendi') : App.islemTuru === 'transfer' ? t('islem.transferKaydedildi') : t('islem.harcamaEklendi'), 'basari');
        }
        await App.yenile();
      } catch (err) {
        App.toast(t('hata.hataOneki', { mesaj: err.message }), 'hata');
        App.titresim(100);
      }
    });
  },

  selectGuncelle() {
    const kullanici = API.getKullanici();
    const kullaniciId = kullanici?.id;

    const odeyenOptions = App.uyeler.map(u =>
      `<option value="${u.id}" ${u.kullanici_id === kullaniciId ? 'selected' : ''}>${App.esc(u.isim)}</option>`
    ).join('');

    document.getElementById('tx-payer').innerHTML =
      (odeyenOptions || `<option value="">${t('islem.uyeYok')}</option>`) +
      `<option value="__kasa__">${t('islem.sirketKasasi')}</option>`;

    const alanOptions = App.uyeler.map(u =>
      `<option value="${u.id}">${App.esc(u.isim)}</option>`
    ).join('');
    document.getElementById('tx-receiver').innerHTML = alanOptions || `<option value="">${t('islem.uyeYok')}</option>`;
  },

  async islemListesiGoster() {
    const list = document.getElementById('tx-list');
    const empty = document.getElementById('tx-empty');

    try {
      const islemler = await API.getIslemler();
      if (islemler.length === 0) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
        return;
      }
      empty.classList.add('hidden');

      const uyeMap = {};
      App.uyeler.forEach(u => { uyeMap[u.id] = u; });

      const izleyici = App.rol === 'izleyici';

      list.innerHTML = islemler.slice().reverse().map(i => {
        const odeyen = uyeMap[i.odeyen_id] || { isim: '?', renk: '#999' };
        const transferMi = i.tur === 'transfer';
        const kasaMi = i.kasa_mi;
        const alan = transferMi ? (uyeMap[i.alan_id] || { isim: '?', renk: '#999' }) : null;

        let turBadge;
        if (kasaMi) {
          turBadge = `<span class="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">${t('tur.kasa')}</span>`;
        } else if (transferMi) {
          turBadge = `<span class="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand">${t('tur.transfer')}</span>`;
        } else {
          turBadge = `<span class="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">${t('tur.harcama')}</span>`;
        }

        return `
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                ${kasaMi ? `<div class="w-3 h-3 rounded-full bg-purple-400"></div><span class="font-medium text-sm text-gray-700">${t('tur.kasa')}</span>` : `
                  <div class="w-3 h-3 rounded-full" style="background: ${odeyen.renk}"></div>
                  <span class="font-medium text-sm text-gray-700">${App.esc(odeyen.isim)}</span>
                `}
                ${transferMi ? `
                  <svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  <div class="w-3 h-3 rounded-full" style="background: ${alan.renk}"></div>
                  <span class="font-medium text-sm text-gray-700">${App.esc(alan.isim)}</span>
                ` : ''}
              </div>
              <span class="font-bold text-gray-900">${App.formatPara(i.tutar)} ₺</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                ${turBadge}
                ${i.aciklama ? `<span class="text-xs text-gray-400">${App.esc(i.aciklama)}</span>` : ''}
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-400">${i.tarih}</span>
                ${!izleyici ? `
                  <button class="islem-sil p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition" data-id="${i.id}">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');

      list.addEventListener('click', async (e) => {
        const btn = e.target.closest('.islem-sil');
        if (!btn) return;
        App.islemSil(parseInt(btn.dataset.id));
      });
    } catch (err) {
      console.error(err);
    }
  },

  async islemSil(id) {
    if (!confirm(t('islem.silOnay'))) return;
    try {
      await API.deleteIslem(id);
      App.titresim();
      App.toast(t('islem.silindi'), 'bilgi');
      await App.yenile();
      App.islemListesiGoster();
    } catch (err) {
      App.toast(t('hata.hataOneki', { mesaj: err.message }), 'hata');
    }
  }
});
