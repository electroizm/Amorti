/**
 * AMØRT! Ana Uygulama Mantığı
 * Auth akışı, şirket seçimi, harcama/transfer, davet, rol kontrolü
 */
const App = {
  mevcutSayfa: 'home',
  islemTuru: 'harcama',
  uyeler: [],
  rol: null, // kullanicinin bu sirketteki rolu

  async init() {
    if (API.girisYapildiMi() && API.getSirketId()) {
      this.ekranGoster('app');
      this.bindApp();
      await this.yenile();
    } else if (API.girisYapildiMi()) {
      this.ekranGoster('sirket');
      this.bindSirketSecici();
    } else {
      this.ekranGoster('auth');
      this.bindAuth();
    }
  },

  // ─── Ekran Yonetimi ───
  ekranGoster(ekran) {
    document.querySelectorAll('.ekran').forEach(e => e.classList.remove('active'));
    document.getElementById(`ekran-${ekran}`).classList.add('active');
  },

  // ─── Toast ───
  toast(mesaj, tip = 'basari') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast toast-${tip}`;
    el.textContent = mesaj;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  },

  titresim(ms = 50) {
    if (navigator.vibrate) navigator.vibrate(ms);
  },

  // ═══════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════
  bindAuth() {
    const tabGiris = document.getElementById('auth-tab-giris');
    const tabKayit = document.getElementById('auth-tab-kayit');
    const formGiris = document.getElementById('form-giris');
    const formKayit = document.getElementById('form-kayit');

    tabGiris.addEventListener('click', () => {
      tabGiris.classList.add('bg-brand', 'text-white');
      tabGiris.classList.remove('text-gray-500');
      tabKayit.classList.remove('bg-brand', 'text-white');
      tabKayit.classList.add('text-gray-500');
      formGiris.classList.remove('hidden');
      formKayit.classList.add('hidden');
    });

    tabKayit.addEventListener('click', () => {
      tabKayit.classList.add('bg-brand', 'text-white');
      tabKayit.classList.remove('text-gray-500');
      tabGiris.classList.remove('bg-brand', 'text-white');
      tabGiris.classList.add('text-gray-500');
      formKayit.classList.remove('hidden');
      formGiris.classList.add('hidden');
    });

    formGiris.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = formGiris.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        await API.giris(
          document.getElementById('giris-eposta').value,
          document.getElementById('giris-sifre').value
        );
        this.toast('Giriş başarılı', 'basari');
        this.ekranGoster('sirket');
        this.bindSirketSecici();
      } catch (err) {
        this.toast(err.message, 'hata');
        this.titresim(100);
      } finally {
        btn.disabled = false;
      }
    });

    formKayit.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = formKayit.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        const sonuc = await API.kayit(
          document.getElementById('kayit-isim').value,
          document.getElementById('kayit-eposta').value,
          document.getElementById('kayit-sifre').value
        );
        if (sonuc.dogrulama_gerekli) {
          this.toast(sonuc.mesaj, 'bilgi');
          // Giris tabina gec
          tabGiris.click();
          return;
        }
        this.toast('Hesap oluşturuldu', 'basari');
        this.ekranGoster('sirket');
        this.bindSirketSecici();
      } catch (err) {
        this.toast(err.message, 'hata');
        this.titresim(100);
      } finally {
        btn.disabled = false;
      }
    });
  },

  // ═══════════════════════════════════════
  // SIRKET SECICI
  // ═══════════════════════════════════════
  bindSirketSecici() {
    this.sirketleriYukle();

    document.getElementById('form-sirket').addEventListener('submit', async (e) => {
      e.preventDefault();
      const isim = document.getElementById('sirket-isim').value.trim();
      if (!isim) return;
      try {
        const sirket = await API.sirketOlustur(isim);
        this.toast(`${isim} oluşturuldu`, 'basari');
        document.getElementById('sirket-isim').value = '';
        API.setSirketId(sirket.id);
        this.ekranGoster('app');
        this.bindApp();
        await this.yenile();
      } catch (err) {
        this.toast(err.message, 'hata');
      }
    });

    document.getElementById('btn-cikis-sirket').addEventListener('click', async () => {
      await API.cikis();
      window.location.reload();
    });
  },

  async sirketleriYukle() {
    try {
      // Sirketler
      const sirketler = await API.getSirketler();
      const container = document.getElementById('sirket-listesi');

      // Tek sirket varsa otomatik sec
      if (sirketler.length === 1) {
        API.setSirketId(sirketler[0].id);
        this.ekranGoster('app');
        this.bindApp();
        await this.yenile();
        return;
      }

      if (sirketler.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">Henüz şirketiniz yok.</p>';
      } else {
        container.innerHTML = sirketler.map(s => `
          <button class="sirket-sec w-full bg-white rounded-xl p-4 text-left shadow-sm border border-gray-100 hover:border-brand transition" data-id="${s.id}">
            <p class="font-semibold text-gray-900">${this.esc(s.isim)}</p>
            <p class="text-xs text-gray-400 mt-0.5">Rol: ${this.rolGoster(s.rol)}</p>
          </button>
        `).join('');

        container.querySelectorAll('.sirket-sec').forEach(btn => {
          btn.addEventListener('click', async () => {
            API.setSirketId(btn.dataset.id);
            this.ekranGoster('app');
            this.bindApp();
            await this.yenile();
          });
        });
      }

      // Bekleyen davetler
      const davetler = await API.bekleyenDavetler();
      const davetContainer = document.getElementById('bekleyen-davetler');
      const davetListesi = document.getElementById('davet-listesi-bekleyen');

      if (davetler.length > 0) {
        davetContainer.classList.remove('hidden');
        davetListesi.innerHTML = davetler.map(d => `
          <div class="bg-white rounded-xl p-3 shadow-sm border border-brand/20 flex items-center justify-between">
            <div>
              <p class="font-medium text-sm text-gray-900">${this.esc(d.sirketler?.isim || '?')}</p>
              <p class="text-xs text-gray-400">Rol: ${this.rolGoster(d.rol)}</p>
            </div>
            <div class="flex gap-2">
              <button class="davet-kabul px-3 py-1.5 bg-brand text-white text-xs rounded-lg font-semibold" data-id="${d.id}">Kabul</button>
              <button class="davet-red px-3 py-1.5 bg-gray-100 text-gray-500 text-xs rounded-lg font-semibold" data-id="${d.id}">Red</button>
            </div>
          </div>
        `).join('');

        davetListesi.querySelectorAll('.davet-kabul').forEach(btn => {
          btn.addEventListener('click', async () => {
            try {
              await API.davetKabul(btn.dataset.id);
              this.toast('Davet kabul edildi', 'basari');
              this.sirketleriYukle();
            } catch (err) { this.toast(err.message, 'hata'); }
          });
        });

        davetListesi.querySelectorAll('.davet-red').forEach(btn => {
          btn.addEventListener('click', async () => {
            try {
              await API.davetRed(btn.dataset.id);
              this.toast('Davet reddedildi', 'bilgi');
              this.sirketleriYukle();
            } catch (err) { this.toast(err.message, 'hata'); }
          });
        });
      } else {
        davetContainer.classList.add('hidden');
      }
    } catch (err) {
      console.error('sirketleriYukle hatasi:', err);
      this.toast('Veriler yüklenemedi: ' + err.message, 'hata');
    }
  },

  // ═══════════════════════════════════════
  // ANA UYGULAMA
  // ═══════════════════════════════════════
  _appBound: false,

  bindApp() {
    if (this._appBound) return;
    this._appBound = true;

    this.bindNavigation();
    this.bindFAB();
    this.bindIslemModal();
    this.bindDavetModal();
    this.varsayilanTarih();

    // Sirket degistir
    document.getElementById('btn-sirket-degistir').addEventListener('click', () => {
      API.setSirketId(null);
      this._appBound = false;
      this.ekranGoster('sirket');
      this.bindSirketSecici();
    });

    // Profil / Cikis
    document.getElementById('btn-profil').addEventListener('click', () => {
      this.navigate('settings');
    });

    document.getElementById('btn-cikis').addEventListener('click', async () => {
      await API.cikis();
      window.location.reload();
    });
  },

  // ─── Navigasyon ───
  bindNavigation() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => this.navigate(btn.dataset.page));
    });
  },

  navigate(sayfa) {
    this.mevcutSayfa = sayfa;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${sayfa}`).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${sayfa}"]`).classList.add('active');

    const fab = document.getElementById('fab');
    const izleyici = this.rol === 'izleyici';
    fab.style.display = (!izleyici && (sayfa === 'home' || sayfa === 'transactions')) ? 'flex' : 'none';

    if (sayfa === 'partners') this.uyeListesiGoster();
    if (sayfa === 'transactions') this.islemListesiGoster();
  },

  // ─── Veri Yenileme ───
  async yenile() {
    try {
      const ozet = await API.getOzet();
      this.uyeler = ozet.uyeler;
      this.rol = ozet.rol;

      // Header'da sirket ismi
      // Sirket ismini sirketler listesinden cekmek yerine basit gosterim
      document.getElementById('btn-sirket-degistir').textContent = '↔ Değiştir';

      // Ozet karti
      document.getElementById('ozet-toplam').textContent = this.formatPara(ozet.toplamHarcama) + ' ₺';

      const kasaBadge = document.getElementById('ozet-kasa-badge');
      if (ozet.kasaHarcama > 0) {
        kasaBadge.classList.remove('hidden');
        kasaBadge.textContent = `Kasa: ${this.formatPara(ozet.kasaHarcama)} ₺`;
      } else {
        kasaBadge.classList.add('hidden');
      }

      const kisisel = ozet.toplamHarcama - (ozet.kasaHarcama || 0);
      document.getElementById('ozet-alt').textContent = `${ozet.uyeler.length} üye • Kişisel: ${this.formatPara(kisisel)} ₺`;

      // Kartlar & borc
      this.ortakKartlariGoster(ozet);
      this.borcBolumuGoster(ozet);
      this.selectGuncelle();

      // Ayarlar sayfasi
      const kullanici = API.getKullanici();
      document.getElementById('ayar-kullanici').textContent = kullanici ? `${kullanici.isim} (${kullanici.eposta})` : '';
      document.getElementById('ayar-rol').textContent = `Rol: ${this.rolGoster(this.rol)}`;

      // Bos durum
      const bos = document.getElementById('empty-state');
      bos.classList.toggle('hidden', ozet.uyeler.length > 0 && ozet.toplamHarcama > 0);

      // FAB: izleyici icin gizle
      const fab = document.getElementById('fab');
      const izleyici = this.rol === 'izleyici';
      fab.style.display = (!izleyici && (this.mevcutSayfa === 'home' || this.mevcutSayfa === 'transactions')) ? 'flex' : 'none';

      // Davet butonu: sadece yonetici
      const btnDavet = document.getElementById('btn-davet-gonder');
      btnDavet.classList.toggle('hidden', this.rol !== 'yonetici');

    } catch (err) {
      console.error('Veri yükleme hatası:', err);
      if (err.message.includes('erişim')) {
        API.setSirketId(null);
        this.ekranGoster('sirket');
        this.bindSirketSecici();
      }
    }
  },

  // ─── Ortak Kartlari ───
  ortakKartlariGoster(ozet) {
    const container = document.getElementById('partner-cards');
    if (ozet.uyeler.length === 0) { container.innerHTML = ''; return; }

    container.innerHTML = ozet.uyeler.map(u => {
      const harcanan = ozet.harcamalar[u.id] || 0;
      const bakiye = ozet.bakiyeler[u.id] || 0;
      const bakiyeClass = bakiye > 0 ? 'text-emerald-600' : bakiye < 0 ? 'text-red-500' : 'text-gray-400';
      const bakiyeLabel = bakiye > 0 ? 'alacaklı' : bakiye < 0 ? 'borçlu' : 'eşit';

      return `
        <div class="bg-white rounded-xl p-4 border-l-4 shadow-sm" style="border-color: ${u.renk}">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-3 h-3 rounded-full" style="background: ${u.renk}"></div>
            <span class="font-semibold text-sm text-gray-900">${this.esc(u.isim)}</span>
          </div>
          <p class="text-lg font-bold text-gray-900">${this.formatPara(harcanan)} ₺</p>
          <p class="text-xs ${bakiyeClass}">${bakiye > 0 ? '+' : ''}${this.formatPara(bakiye)} ₺ ${bakiyeLabel}</p>
        </div>
      `;
    }).join('');
  },

  // ─── Borc Onerileri ───
  borcBolumuGoster(ozet) {
    const section = document.getElementById('debt-section');
    const container = document.getElementById('debt-transfers');

    if (ozet.onerilen_transferler.length === 0) { section.classList.add('hidden'); return; }
    section.classList.remove('hidden');

    const uyeMap = {};
    ozet.uyeler.forEach(u => { uyeMap[u.id] = u; });

    container.innerHTML = ozet.onerilen_transferler.map(t => {
      const kimden = uyeMap[t.kimden];
      const kime = uyeMap[t.kime];
      if (!kimden || !kime) return '';
      return `
        <div class="transfer-card rounded-xl p-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" style="background: ${kimden.renk}"></div>
            <span class="font-medium text-sm text-gray-700">${this.esc(kimden.isim)}</span>
            <div class="transfer-arrow w-6 h-5 flex items-center justify-center">
              <svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </div>
            <div class="w-3 h-3 rounded-full" style="background: ${kime.renk}"></div>
            <span class="font-medium text-sm text-gray-700">${this.esc(kime.isim)}</span>
          </div>
          <span class="font-bold text-brand">${this.formatPara(t.tutar)} ₺</span>
        </div>
      `;
    }).join('');
  },

  // ─── Select Guncelle ───
  selectGuncelle() {
    const kullanici = API.getKullanici();
    const kullaniciId = kullanici?.id;

    // Odeyen: uyeler + Sirket Kasasi
    const odeyenOptions = this.uyeler.map(u =>
      `<option value="${u.id}" ${u.kullanici_id === kullaniciId ? 'selected' : ''}>${this.esc(u.isim)}</option>`
    ).join('');

    document.getElementById('tx-payer').innerHTML =
      (odeyenOptions || '<option value="">Üye yok</option>') +
      '<option value="__kasa__">Şirket Kasası</option>';

    // Alan: sadece uyeler
    const alanOptions = this.uyeler.map(u =>
      `<option value="${u.id}">${this.esc(u.isim)}</option>`
    ).join('');
    document.getElementById('tx-receiver').innerHTML = alanOptions || '<option value="">Üye yok</option>';
  },

  // ─── FAB ───
  bindFAB() {
    document.getElementById('fab').addEventListener('click', () => {
      if (this.uyeler.length < 1) {
        this.toast('Henüz üye yok!', 'hata');
        this.titresim(100);
        return;
      }
      this.modalAc('modal-tx');
    });
  },

  // ─── Islem Modal ───
  bindIslemModal() {
    document.getElementById('modal-tx-close').addEventListener('click', () => this.modalKapat('modal-tx'));
    document.getElementById('modal-tx').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.modalKapat('modal-tx');
    });

    document.querySelectorAll('.tx-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.islemTuru = tab.dataset.type;
        document.querySelectorAll('.tx-tab').forEach(t => {
          t.classList.remove('bg-brand', 'text-white');
          t.classList.add('text-gray-400');
        });
        tab.classList.add('bg-brand', 'text-white');
        tab.classList.remove('text-gray-400');

        const receiverGroup = document.getElementById('tx-receiver-group');
        receiverGroup.classList.toggle('hidden', this.islemTuru !== 'transfer');

        // Transfer modunda kasa secenegi gizle
        const kasaOpt = document.querySelector('#tx-payer option[value="__kasa__"]');
        if (kasaOpt) kasaOpt.style.display = this.islemTuru === 'transfer' ? 'none' : '';
      });
    });

    document.getElementById('form-tx').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payerVal = document.getElementById('tx-payer').value;
      const kasaMi = payerVal === '__kasa__';

      const data = {
        tur: this.islemTuru,
        odeyen_id: kasaMi ? this.uyeler[0]?.id : payerVal,
        tutar: parseFloat(document.getElementById('tx-amount').value),
        aciklama: document.getElementById('tx-desc').value,
        tarih: document.getElementById('tx-date').value,
        kasa_mi: kasaMi
      };

      if (this.islemTuru === 'transfer') {
        data.alan_id = document.getElementById('tx-receiver').value;
        if (data.odeyen_id === data.alan_id) {
          this.toast('Ödeyen ve alan aynı kişi olamaz!', 'hata');
          this.titresim(100);
          return;
        }
      }

      try {
        await API.addIslem(data);
        this.titresim();
        this.modalKapat('modal-tx');
        document.getElementById('form-tx').reset();
        this.varsayilanTarih();
        this.selectGuncelle();
        this.toast(kasaMi ? 'Kasa harcaması eklendi' : this.islemTuru === 'transfer' ? 'Transfer kaydedildi' : 'Harcama eklendi', 'basari');
        await this.yenile();
      } catch (err) {
        this.toast('Hata: ' + err.message, 'hata');
        this.titresim(100);
      }
    });
  },

  // ─── Davet Modal ───
  bindDavetModal() {
    document.getElementById('btn-davet-gonder').addEventListener('click', () => {
      this.modalAc('modal-davet');
    });

    document.getElementById('modal-davet-close').addEventListener('click', () => this.modalKapat('modal-davet'));
    document.getElementById('modal-davet').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.modalKapat('modal-davet');
    });

    document.getElementById('form-davet').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await API.davetGonder(
          document.getElementById('davet-eposta').value,
          document.getElementById('davet-rol').value
        );
        this.titresim();
        this.modalKapat('modal-davet');
        document.getElementById('form-davet').reset();
        this.toast('Davet gönderildi', 'basari');
        if (this.mevcutSayfa === 'partners') this.uyeListesiGoster();
      } catch (err) {
        this.toast(err.message, 'hata');
        this.titresim(100);
      }
    });
  },

  // ─── Uye Listesi ───
  async uyeListesiGoster() {
    const list = document.getElementById('partner-list');
    const empty = document.getElementById('partner-empty');
    const yonetici = this.rol === 'yonetici';

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
                <p class="font-semibold text-gray-900">${this.esc(u.isim)}</p>
                <p class="text-xs text-gray-400">${this.rolGoster(u.rol)}</p>
              </div>
            </div>
            ${yonetici ? `
              <div class="flex gap-1">
                <select class="rol-degistir text-xs border border-gray-200 rounded-lg px-2 py-1" data-id="${u.id}">
                  <option value="yonetici" ${u.rol === 'yonetici' ? 'selected' : ''}>Yönetici</option>
                  <option value="uye" ${u.rol === 'uye' ? 'selected' : ''}>Üye</option>
                  <option value="izleyici" ${u.rol === 'izleyici' ? 'selected' : ''}>İzleyici</option>
                </select>
                <button class="uye-sil p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition" data-id="${u.id}" data-isim="${this.esc(u.isim)}">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            ` : ''}
          </div>
        `).join('');

        // Rol degistir
        list.querySelectorAll('.rol-degistir').forEach(sel => {
          sel.addEventListener('change', async () => {
            try {
              await API.uyeRolDegistir(sel.dataset.id, sel.value);
              this.toast('Rol güncellendi', 'basari');
            } catch (err) {
              this.toast(err.message, 'hata');
              this.uyeListesiGoster();
            }
          });
        });

        // Uye sil
        list.querySelectorAll('.uye-sil').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!confirm(`"${btn.dataset.isim}" üyesini çıkarmak istediğinize emin misiniz?`)) return;
            try {
              await API.uyeSil(btn.dataset.id);
              this.titresim();
              this.toast('Üye çıkarıldı', 'bilgi');
              await this.yenile();
              this.uyeListesiGoster();
            } catch (err) { this.toast(err.message, 'hata'); }
          });
        });
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
                    <p class="text-sm font-medium text-gray-700">${this.esc(d.eposta)}</p>
                    <p class="text-xs text-gray-400">Rol: ${this.rolGoster(d.rol)}</p>
                  </div>
                  <span class="text-xs px-2 py-0.5 rounded-full font-medium ${durumRenk}">${this.durumGoster(d.durum)}</span>
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

  // ─── Islem Listesi ───
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
      this.uyeler.forEach(u => { uyeMap[u.id] = u; });

      const izleyici = this.rol === 'izleyici';

      list.innerHTML = islemler.slice().reverse().map(i => {
        const odeyen = uyeMap[i.odeyen_id] || { isim: '?', renk: '#999' };
        const transferMi = i.tur === 'transfer';
        const kasaMi = i.kasa_mi;
        const alan = transferMi ? (uyeMap[i.alan_id] || { isim: '?', renk: '#999' }) : null;

        let turBadge;
        if (kasaMi) {
          turBadge = '<span class="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">Kasa</span>';
        } else if (transferMi) {
          turBadge = '<span class="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand">Transfer</span>';
        } else {
          turBadge = '<span class="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Harcama</span>';
        }

        return `
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                ${kasaMi ? '<div class="w-3 h-3 rounded-full bg-purple-400"></div><span class="font-medium text-sm text-gray-700">Kasa</span>' : `
                  <div class="w-3 h-3 rounded-full" style="background: ${odeyen.renk}"></div>
                  <span class="font-medium text-sm text-gray-700">${this.esc(odeyen.isim)}</span>
                `}
                ${transferMi ? `
                  <svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  <div class="w-3 h-3 rounded-full" style="background: ${alan.renk}"></div>
                  <span class="font-medium text-sm text-gray-700">${this.esc(alan.isim)}</span>
                ` : ''}
              </div>
              <span class="font-bold text-gray-900">${this.formatPara(i.tutar)} ₺</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                ${turBadge}
                ${i.aciklama ? `<span class="text-xs text-gray-400">${this.esc(i.aciklama)}</span>` : ''}
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-400">${i.tarih}</span>
                ${!izleyici ? `
                  <button onclick="App.islemSil(${i.id})" class="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error(err);
    }
  },

  async islemSil(id) {
    if (!confirm('Bu işlemi silmek istediğinize emin misiniz?')) return;
    try {
      await API.deleteIslem(id);
      this.titresim();
      this.toast('İşlem silindi', 'bilgi');
      await this.yenile();
      this.islemListesiGoster();
    } catch (err) {
      this.toast('Hata: ' + err.message, 'hata');
    }
  },

  // ─── Yardimcilar ───
  modalAc(id) { document.getElementById(id).classList.add('open'); },
  modalKapat(id) { document.getElementById(id).classList.remove('open'); },

  varsayilanTarih() {
    const el = document.getElementById('tx-date');
    if (el) el.value = new Date().toISOString().split('T')[0];
  },

  formatPara(n) {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(n || 0);
  },

  // ─── Türkçe Gösterim Yardımcıları ───
  rolGoster(rol) {
    const roller = { yonetici: 'Yönetici', uye: 'Üye', izleyici: 'İzleyici' };
    return roller[rol] || rol;
  },

  durumGoster(durum) {
    const durumlar = { bekliyor: 'Bekliyor', kabul: 'Kabul Edildi', red: 'Reddedildi' };
    return durumlar[durum] || durum;
  },

  esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
