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
        // %100 kontrolü
        const mevcutOrtaklar = App.ortaklar || [];
        const toplamPay = mevcutOrtaklar.reduce((s, o) => s + (o.pay != null ? parseFloat(o.pay) : 0), 0);
        if (toplamPay >= 100) {
          App.toast(t('ortak.payDolu'), 'hata');
          return;
        }
        formDiv.classList.toggle('hidden');
        toggleBtn.classList.add('hidden');
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

        const uyeHtml = uyeler.map(u => `
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
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            ` : ''}
          </div>
        `).join('');
        list.innerHTML = uyeHtml;
        App.ikonlariGuncelle();

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
          <div class="ortak-wrapper" data-id="${o.id}">
            <div class="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full" style="background: ${o.renk}"></div>
                <div>
                  <p class="font-semibold text-gray-900">${App.esc(o.isim)}</p>
                  <p class="text-xs text-gray-400">${o.pay != null ? `${t('ortak.payLabel')}: %${o.pay}` : t('ortak.payPlaceholder')}</p>
                </div>
              </div>
              ${yonetici ? `
                <div class="flex gap-1">
                  <button class="ortak-duzenle p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition" data-id="${o.id}">
                    <i data-lucide="pencil" class="w-4 h-4"></i>
                  </button>
                  <button class="ortak-sil p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition" data-id="${o.id}" data-isim="${App.esc(o.isim)}">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                </div>
              ` : ''}
            </div>
            <div class="ortak-edit-panel hidden"></div>
          </div>
        `).join('');
        App.ikonlariGuncelle();
      }

      if (toggleBtn) toggleBtn.classList.toggle('hidden', !yonetici);

      if (!list._ortakDelegated) {
        list._ortakDelegated = true;
        list.addEventListener('click', async (e) => {
          // Düzenle
          const duzenleBtn = e.target.closest('.ortak-duzenle');
          if (duzenleBtn) {
            const id = duzenleBtn.dataset.id;
            const wrapper = list.querySelector(`.ortak-wrapper[data-id="${id}"]`);
            const panel = wrapper.querySelector('.ortak-edit-panel');
            // Kapatma toggle
            if (!panel.classList.contains('hidden')) {
              panel.classList.add('hidden');
              return;
            }
            // Diğer açık panelleri kapat
            list.querySelectorAll('.ortak-edit-panel').forEach(p => p.classList.add('hidden'));
            const o = App.ortaklar.find(x => x.id === id);
            panel.innerHTML = `
              <div class="bg-gray-50 rounded-b-xl p-3 border border-t-0 border-gray-100 space-y-2">
                <div class="flex gap-2">
                  <input type="text" class="ortak-edit-isim flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5" value="${App.esc(o.isim)}" placeholder="${t('ortak.isimLabel')}">
                  <input type="color" class="ortak-edit-renk w-9 h-9 rounded-lg border border-gray-200 cursor-pointer" value="${o.renk}">
                </div>
                <div class="flex gap-2 items-center">
                  <input type="number" class="ortak-edit-pay flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5" value="${o.pay != null ? o.pay : ''}" placeholder="${t('ortak.payPlaceholder')}" step="0.01" min="0" max="100">
                  <span class="text-xs text-gray-400">%</span>
                </div>
                <div class="flex gap-2">
                  <button class="ortak-duzenle-kaydet flex-1 py-1.5 bg-brand text-white text-xs rounded-lg font-semibold" data-id="${id}">${t('ortak.kaydetBtn')}</button>
                  <button class="ortak-duzenle-iptal flex-1 py-1.5 bg-gray-100 text-gray-500 text-xs rounded-lg font-semibold">${t('ortak.iptalBtn')}</button>
                </div>
              </div>`;
            panel.classList.remove('hidden');
            return;
          }

          // Düzenle kaydet
          const kaydetBtn = e.target.closest('.ortak-duzenle-kaydet');
          if (kaydetBtn) {
            const id = kaydetBtn.dataset.id;
            const wrapper = list.querySelector(`.ortak-wrapper[data-id="${id}"]`);
            const isim = wrapper.querySelector('.ortak-edit-isim').value.trim();
            const renk = wrapper.querySelector('.ortak-edit-renk').value;
            const payVal = wrapper.querySelector('.ortak-edit-pay').value;
            const pay = payVal ? parseFloat(payVal) : null;
            try {
              await API.ortakGuncelle(id, { isim, renk, pay });
              App.toast(t('ortak.guncellendi'), 'basari');
              App.ortakListesiGoster();
              await App.yenile();
            } catch (err) { App.toast(err.message, 'hata'); }
            return;
          }

          // Düzenle iptal
          if (e.target.closest('.ortak-duzenle-iptal')) {
            e.target.closest('.ortak-edit-panel').classList.add('hidden');
            return;
          }

          // Sil
          const silBtn = e.target.closest('.ortak-sil');
          if (silBtn) {
            const id = silBtn.dataset.id;
            const wrapper = list.querySelector(`.ortak-wrapper[data-id="${id}"]`);
            const panel = wrapper.querySelector('.ortak-edit-panel');
            // Kapatma toggle
            if (!panel.classList.contains('hidden') && panel.querySelector('.ortak-devir-select')) {
              panel.classList.add('hidden');
              return;
            }
            list.querySelectorAll('.ortak-edit-panel').forEach(p => p.classList.add('hidden'));
            const digerOrtaklar = App.ortaklar.filter(o => o.id !== id);
            if (digerOrtaklar.length === 0) {
              // Tek ortak, direkt sil
              if (!confirm(t('ortak.silOnay', { isim: silBtn.dataset.isim }))) return;
              try {
                await API.ortakSil(id);
                App.titresim();
                App.toast(t('ortak.silindi'), 'bilgi');
                App.ortakListesiGoster();
                await App.yenile();
              } catch (err) { App.toast(err.message, 'hata'); }
              return;
            }
            // Devir paneli göster
            panel.innerHTML = `
              <div class="bg-red-50 rounded-b-xl p-3 border border-t-0 border-red-100 space-y-2">
                <p class="text-xs text-red-600 font-medium">${t('ortak.devirSecim')}</p>
                <select class="ortak-devir-select w-full text-sm border border-red-200 rounded-lg px-3 py-1.5">
                  ${digerOrtaklar.map(o => `<option value="${o.id}">${App.esc(o.isim)}</option>`).join('')}
                </select>
                <div class="flex gap-2">
                  <button class="ortak-sil-onayla flex-1 py-1.5 bg-red-500 text-white text-xs rounded-lg font-semibold" data-id="${id}">${t('ortak.silVeDevret')}</button>
                  <button class="ortak-duzenle-iptal flex-1 py-1.5 bg-gray-100 text-gray-500 text-xs rounded-lg font-semibold">${t('ortak.iptalBtn')}</button>
                </div>
              </div>`;
            panel.classList.remove('hidden');
            return;
          }

          // Sil onayla
          const onaylaBtn = e.target.closest('.ortak-sil-onayla');
          if (onaylaBtn) {
            const id = onaylaBtn.dataset.id;
            const wrapper = list.querySelector(`.ortak-wrapper[data-id="${id}"]`);
            const hedefId = wrapper.querySelector('.ortak-devir-select').value;
            try {
              await API.ortakSil(id, hedefId);
              App.titresim();
              App.toast(t('ortak.silindi'), 'bilgi');
              App.ortakListesiGoster();
              await App.yenile();
            } catch (err) { App.toast(err.message, 'hata'); }
          }
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
});
