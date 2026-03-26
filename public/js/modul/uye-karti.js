/**
 * AMØRT! Üye Kartı Modülü
 * Üye listesi, davet modal, davet listesi
 */
Object.assign(App, {
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
  },

  async uyeListesiGoster() {
    const list = document.getElementById('partner-list');
    const empty = document.getElementById('partner-empty');
    const yonetici = App.rol === 'yonetici';

    try {
      const uyeler = await API.getUyeler();
      if (uyeler.length === 0) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
      } else {
        empty.classList.add('hidden');
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
              <div class="flex gap-1">
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
            if (!sel) return;
            try {
              await API.uyeRolDegistir(sel.dataset.id, sel.value);
              App.toast(t('uye.rolGuncellendi'), 'basari');
            } catch (err) {
              App.toast(err.message, 'hata');
              App.uyeListesiGoster();
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
  }
});
