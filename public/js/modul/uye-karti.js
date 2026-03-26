/**
 * AMØRT! Üye Kartı Modülü
 * Üye listesi, ortak listesi, tab geçişi, davet modal
 */
Object.assign(App, {
  _partnerTab: 'uyeler',

  bindDavetModal() {
    document.getElementById('btn-davet-gonder').addEventListener('click', () => {
      App.modalAc('modal-davet');
    });

    document.getElementById('modal-davet-close').addEventListener('click', () => App.modalKapat('modal-davet'));
    document.getElementById('modal-davet').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) App.modalKapat('modal-davet');
    });

    document.getElementById('form-davet').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await API.davetGonder(
          document.getElementById('davet-eposta').value,
          document.getElementById('davet-rol').value
        );
        App.titresim();
        App.modalKapat('modal-davet');
        document.getElementById('form-davet').reset();
        App.toast(t('davet.gonderildi'), 'basari');
        if (App.mevcutSayfa === 'partners') App.uyeListesiGoster();
      } catch (err) {
        App.toast(err.message, 'hata');
        App.titresim(100);
      }
    });

    // Tab geçişi
    document.querySelectorAll('.partner-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        App._partnerTab = tab.dataset.tab;
        document.querySelectorAll('.partner-tab').forEach(t => {
          t.classList.remove('bg-brand', 'text-white');
          t.classList.add('text-gray-400');
        });
        tab.classList.add('bg-brand', 'text-white');
        tab.classList.remove('text-gray-400');

        document.getElementById('tab-uyeler').classList.toggle('hidden', App._partnerTab !== 'uyeler');
        document.getElementById('tab-ortaklar').classList.toggle('hidden', App._partnerTab !== 'ortaklar');

        // Davet butonu sadece üyeler tab'ında
        const btnDavet = document.getElementById('btn-davet-gonder');
        btnDavet.classList.toggle('hidden', App._partnerTab !== 'uyeler' || App.rol !== 'yonetici');

        if (App._partnerTab === 'ortaklar') App.ortakListesiGoster();
      });
    });

    // Ortak ekleme
    this.bindOrtakForm();
  },

  bindOrtakForm() {
    const toggleBtn = document.getElementById('btn-ortak-ekle-toggle');
    const formDiv = document.getElementById('ortak-ekle-form');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        formDiv.classList.toggle('hidden');
        toggleBtn.classList.add('hidden');
        // Kalan pay'ı placeholder'a yaz
        const mevcutOrtaklar = App.ortaklar || [];
        const toplamPay = mevcutOrtaklar.reduce((s, o) => s + (o.pay != null ? parseFloat(o.pay) : 0), 0);
        const payInput = document.getElementById('ortak-pay');
        if (toplamPay > 0 && toplamPay < 100) {
          payInput.placeholder = `Kalan: %${Math.round((100 - toplamPay) * 100) / 100}`;
        } else {
          payInput.placeholder = t('ortak.payPlaceholder');
        }
      });
    }

    document.getElementById('form-ortak').addEventListener('submit', async (e) => {
      e.preventDefault();
      const isim = document.getElementById('ortak-isim').value.trim();
      const renk = document.getElementById('ortak-renk').value;
      const payVal = document.getElementById('ortak-pay').value;
      let pay = payVal ? parseFloat(payVal) : null;

      // Boş bırakıldıysa kalan yüzdeyi hesapla
      if (pay === null) {
        const mevcutOrtaklar = App.ortaklar || [];
        const toplamPay = mevcutOrtaklar.reduce((s, o) => s + (o.pay != null ? parseFloat(o.pay) : 0), 0);
        if (toplamPay > 0 && toplamPay < 100) {
          pay = Math.round((100 - toplamPay) * 100) / 100;
        }
      }

      if (pay != null && pay <= 0) {
        App.toast('Kalan pay %0, yeni ortak eklenemez', 'hata');
        return;
      }

      try {
        await API.ortakEkle({ isim, renk, pay });
        App.titresim();
        App.toast(t('ortak.eklendi'), 'basari');
        document.getElementById('form-ortak').reset();
        document.getElementById('ortak-renk').value = '#6366f1';
        formDiv.classList.add('hidden');
        toggleBtn.classList.remove('hidden');
        App.ortakListesiGoster();
        await App.yenile();
      } catch (err) {
        App.toast(err.message, 'hata');
      }
    });
  },

  async uyeListesiGoster() {
    const list = document.getElementById('partner-list');
    const empty = document.getElementById('partner-empty');
    const yonetici = App.rol === 'yonetici';
    const ortaklar = App.ortaklar || [];

    try {
      const uyeler = await API.getUyeler();
      if (uyeler.length === 0) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
      } else {
        empty.classList.add('hidden');

        // Ortak seçenekleri (dropdown için)
        const ortakOptions = ortaklar.length > 0
          ? `<option value="">${t('uye.ortakYok')}</option>` + ortaklar.map(o =>
              `<option value="${o.id}">${App.esc(o.isim)}</option>`
            ).join('')
          : '';

        list.innerHTML = uyeler.map(u => `
          <div class="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full" style="background: ${u.renk}"></div>
              <div>
                <p class="font-semibold text-gray-900">${App.esc(u.isim)}</p>
                <p class="text-xs text-gray-400">${App.rolGoster(u.rol)}</p>
              </div>
            </div>
            ${yonetici ? `
              <div class="flex gap-1 items-center">
                ${ortaklar.length > 0 ? `
                  <select class="ortak-ata text-xs border border-gray-200 rounded-lg px-2 py-1" data-id="${u.id}">
                    ${ortakOptions.replace(`value="${u.ortak_id}"`, `value="${u.ortak_id}" selected`)}
                  </select>
                ` : ''}
                <select class="rol-degistir text-xs border border-gray-200 rounded-lg px-2 py-1" data-id="${u.id}">
                  <option value="yonetici" ${u.rol === 'yonetici' ? 'selected' : ''}>${t('rol.yonetici')}</option>
                  <option value="uye" ${u.rol === 'uye' ? 'selected' : ''}>${t('rol.uye')}</option>
                  <option value="izleyici" ${u.rol === 'izleyici' ? 'selected' : ''}>${t('rol.izleyici')}</option>
                </select>
                <button class="uye-sil p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition" data-id="${u.id}" data-isim="${App.esc(u.isim)}">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            ` : ''}
          </div>
        `).join('');

        if (!list._delegated) {
          list._delegated = true;
          list.addEventListener('change', async (e) => {
            const sel = e.target.closest('.rol-degistir');
            if (sel) {
              try {
                await API.uyeRolDegistir(sel.dataset.id, sel.value);
                App.toast(t('uye.rolGuncellendi'), 'basari');
              } catch (err) {
                App.toast(err.message, 'hata');
                App.uyeListesiGoster();
              }
              return;
            }
            const ortakSel = e.target.closest('.ortak-ata');
            if (ortakSel) {
              try {
                await API.uyeGuncelle(ortakSel.dataset.id, { ortak_id: ortakSel.value || null });
                App.toast(t('uye.rolGuncellendi'), 'basari');
              } catch (err) {
                App.toast(err.message, 'hata');
                App.uyeListesiGoster();
              }
            }
          });

          list.addEventListener('click', async (e) => {
            const btn = e.target.closest('.uye-sil');
            if (!btn) return;
            if (!confirm(t('uye.silOnay', { isim: btn.dataset.isim }))) return;
            try {
              await API.uyeSil(btn.dataset.id);
              App.titresim();
              App.toast(t('uye.cikarildi'), 'bilgi');
              await App.yenile();
              App.uyeListesiGoster();
            } catch (err) { App.toast(err.message, 'hata'); }
          });
        }
      }

      // Davet listesi (yonetici icin)
      if (yonetici) {
        try {
          const davetler = await API.davetListele();
          const section = document.getElementById('davet-section');
          const listEl = document.getElementById('davet-listesi');

          if (davetler.length > 0) {
            section.classList.remove('hidden');
            listEl.innerHTML = davetler.map(d => {
              const durumRenk = d.durum === 'bekliyor' ? 'text-yellow-600 bg-yellow-50' :
                d.durum === 'kabul' ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50';
              return `
                <div class="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-700">${App.esc(d.eposta)}</p>
                    <p class="text-xs text-gray-400">${t('ayarlar.rol', { rol: App.rolGoster(d.rol) })}</p>
                  </div>
                  <span class="text-xs px-2 py-0.5 rounded-full font-medium ${durumRenk}">${App.durumGoster(d.durum)}</span>
                </div>
              `;
            }).join('');
          } else {
            section.classList.add('hidden');
          }
        } catch (err) { console.error(err); }
      }
    } catch (err) {
      console.error(err);
    }
  },

  async ortakListesiGoster() {
    const list = document.getElementById('ortak-list');
    const empty = document.getElementById('ortak-empty');
    const toggleBtn = document.getElementById('btn-ortak-ekle-toggle');
    const yonetici = App.rol === 'yonetici';

    try {
      const ortaklar = await API.getOrtaklar();
      App.ortaklar = ortaklar;

      if (ortaklar.length === 0) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
      } else {
        empty.classList.add('hidden');
        list.innerHTML = ortaklar.map(o => `
          <div class="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full" style="background: ${o.renk}"></div>
              <div>
                <p class="font-semibold text-gray-900">${App.esc(o.isim)}</p>
                <p class="text-xs text-gray-400">${o.pay != null ? `${t('ortak.payLabel')}: %${o.pay}` : t('ortak.payPlaceholder')}</p>
              </div>
            </div>
            ${yonetici ? `
              <button class="ortak-sil p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition" data-id="${o.id}" data-isim="${App.esc(o.isim)}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            ` : ''}
          </div>
        `).join('');
      }

      // Yönetici ise ekle butonu göster
      if (toggleBtn) toggleBtn.classList.toggle('hidden', !yonetici);

      if (!list._ortakDelegated) {
        list._ortakDelegated = true;
        list.addEventListener('click', async (e) => {
          const btn = e.target.closest('.ortak-sil');
          if (!btn) return;
          if (!confirm(t('ortak.silOnay', { isim: btn.dataset.isim }))) return;
          try {
            await API.ortakSil(btn.dataset.id);
            App.titresim();
            App.toast(t('ortak.silindi'), 'bilgi');
            App.ortakListesiGoster();
            await App.yenile();
          } catch (err) { App.toast(err.message, 'hata'); }
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
});
