/**
 * AMØRT! Ana Uygulama (Orkestratör)
 * Modüller Object.assign ile metotları ekler.
 * Yükleme sırası: hata.js, cevrimdisi.js → istemci.js →
 *   auth-ekran, sirket-ekran, ozet-panel, islem-karti, uye-karti, ayarlar-ekran →
 *   uygulama.js
 */
const App = {
  mevcutSayfa: 'home',
  islemTuru: 'harcama',
  uyeler: [],
  rol: null,
  sirketSayisi: 0,
  sirketIsim: '',

  async init() {
    i18n.init();
    if (window.CevrimdisiKuyruk) CevrimdisiKuyruk.init();

    // Dil secici
    const dilSelect = document.getElementById('ayar-dil');
    if (dilSelect) {
      dilSelect.value = i18n.dil;
      dilSelect.addEventListener('change', () => {
        i18n.dilDegistir(dilSelect.value);
        this.yenile();
      });
    }

    if (API.girisYapildiMi() && API.getSirketId()) {
      this.ekranGoster('app');
      this.bindApp();
      await this.yenile();
      this.realtimeBaslat();
    } else if (API.girisYapildiMi()) {
      this.ekranGoster('sirket');
      this.bindSirketSecici();
    } else {
      this.ekranGoster('auth');
      this.bindAuth();
    }
  },

  ekranGoster(ekran) {
    document.querySelectorAll('.ekran').forEach(e => e.classList.remove('active'));
    document.getElementById(`ekran-${ekran}`).classList.add('active');
  },

  // ─── Toast & Titreşim ───
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

  // ─── Ana Uygulama Bağlama ───
  _appBound: false,

  bindApp() {
    if (this._appBound) return;
    this._appBound = true;

    this.bindNavigation();
    this.bindFAB();
    this.bindIslemModal();
    this.bindDavetModal();
    this.bindAyarlar();
    this.varsayilanTarih();

    // Profil menü (listener'lar sadece 1 kez eklenir)
    if (!this._profilMenuBound) {
      this._profilMenuBound = true;
      const profilMenu = document.getElementById('profil-menu');

      document.getElementById('btn-profil').addEventListener('click', (e) => {
        e.stopPropagation();
        App.profilMenuGuncelle();
        profilMenu.classList.toggle('hidden');
      });

      profilMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const btn = e.target.closest('button');
        if (!btn) return;

        if (btn.classList.contains('sirket-menu-item')) {
          const id = btn.dataset.id;
          if (id !== API.getSirketId()) {
            if (window.GercekZaman) GercekZaman.durdur();
            API.setSirketId(id);
            App.yenile();
            App.realtimeBaslat();
          }
          profilMenu.classList.add('hidden');
          return;
        }

        profilMenu.classList.add('hidden');
        if (btn.id === 'btn-ayarlar-menu') {
          App.navigate('settings');
        }
      });

      document.addEventListener('click', () => {
        profilMenu.classList.add('hidden');
      });
    }

    document.getElementById('btn-cikis').addEventListener('click', async () => {
      await API.cikis();
      window.location.reload();
    });
  },

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
      this.sirketIsim = ozet.sirketIsim || '';

      // Özet kartı
      document.getElementById('ozet-toplam').textContent = this.formatPara(ozet.toplamHarcama) + ' ₺';

      const kasaBadge = document.getElementById('ozet-kasa-badge');
      if (ozet.kasaHarcama > 0) {
        kasaBadge.classList.remove('hidden');
        kasaBadge.textContent = t('ozet.kasaFormat', { isim: this.sirketIsim, tutar: this.formatPara(ozet.kasaHarcama) });
      } else {
        kasaBadge.classList.add('hidden');
      }

      const kisisel = ozet.toplamHarcama - (ozet.kasaHarcama || 0);
      const altKey = ozet.uyeler.length <= 1 ? 'ozet.altBilgiTek' : 'ozet.altBilgi';
      document.getElementById('ozet-alt').textContent = t(altKey, {
        sayi: ozet.uyeler.length,
        tutar: this.formatPara(kisisel)
      });

      this.ortakKartlariGoster(ozet);
      this.borcBolumuGoster(ozet);
      this.oRingGuncelle(ozet);
      this.selectGuncelle();

      // Kullanıcı bilgisi
      const kullanici = API.getKullanici();
      document.getElementById('ayar-kullanici').textContent = kullanici ? `${kullanici.isim} (${kullanici.eposta})` : '';
      document.getElementById('ayar-rol').textContent = t('ayarlar.rol', { rol: this.rolGoster(this.rol) });

      // Boş durum (tek/çok kişi farkı)
      const bos = document.getElementById('empty-state');
      const bosGoster = !(ozet.uyeler.length > 0 && ozet.toplamHarcama > 0);
      bos.classList.toggle('hidden', !bosGoster);
      if (bosGoster) {
        const tekKisi = ozet.uyeler.length <= 1;
        bos.querySelector('[data-i18n="ozet.bosBaslik"]').textContent =
          t(tekKisi ? 'ozet.bosBaslikTek' : 'ozet.bosBaslik');
        bos.querySelector('[data-i18n="ozet.bosAlt"]').textContent =
          t(tekKisi ? 'ozet.bosAltTek' : 'ozet.bosAlt');
      }

      // FAB: izleyici için gizle
      const fab = document.getElementById('fab');
      const izleyici = this.rol === 'izleyici';
      fab.style.display = (!izleyici && (this.mevcutSayfa === 'home' || this.mevcutSayfa === 'transactions')) ? 'flex' : 'none';

      // Davet butonu: sadece yönetici
      const btnDavet = document.getElementById('btn-davet-gonder');
      btnDavet.classList.toggle('hidden', this.rol !== 'yonetici');

      // Profil menüsündeki şirket listesini güncelle
      this.profilMenuGuncelle();

      // Metin ayarlarını yükle
      this.ayarlariYukle();

      // Çöp kutusu (yönetici)
      if (this.copKutusuYukle) this.copKutusuYukle();

    } catch (err) {
      console.error('Veri yukleme hatasi:', err);
      if (err.message.includes('erişim') || err.message.includes('access')) {
        API.setSirketId(null);
        this.ekranGoster('sirket');
        this.bindSirketSecici();
      }
    }
  },

  // ─── Realtime ───
  async realtimeBaslat() {
    if (!window.GercekZaman) return;
    try {
      const config = await fetch('/api/config').then(r => r.json());
      const token = API.getToken();
      const sirketId = API.getSirketId();
      if (config.supabaseUrl && token && sirketId) {
        GercekZaman.baslat(config.supabaseUrl, config.supabaseKey, token, sirketId);
      }
    } catch (err) { console.warn('Realtime baslatilamadi:', err); }
  },

  // ─── Ø Ring ───
  oRingGuncelle(ozet) {
    const svg = document.getElementById('o-ring');
    svg.querySelectorAll('.o-arc').forEach(el => el.remove());

    const slash = svg.querySelector('.o-slash');
    const toplam = ozet.toplamHarcama || 0;

    if (toplam <= 0) {
      if (slash) slash.setAttribute('opacity', '0.25');
      return;
    }
    if (slash) slash.setAttribute('opacity', '0.15');

    const R = 78, C = 2 * Math.PI * R;
    let offset = 0;

    const parcalar = [];
    ozet.uyeler.forEach(u => {
      const tutar = ozet.harcamalar[u.id] || 0;
      if (tutar > 0) parcalar.push({ renk: u.renk, tutar });
    });
    if (ozet.kasaHarcama > 0) {
      parcalar.push({ renk: '#6366f1', tutar: ozet.kasaHarcama });
    }

    const gap = parcalar.length > 1 ? 3 : 0;
    const totalGap = gap * parcalar.length;
    const usable = C - totalGap;

    parcalar.forEach(p => {
      const dash = (p.tutar / toplam) * usable;
      const arc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      arc.setAttribute('class', 'o-arc');
      arc.setAttribute('cx', '100');
      arc.setAttribute('cy', '100');
      arc.setAttribute('r', String(R));
      arc.setAttribute('fill', 'none');
      arc.setAttribute('stroke', p.renk);
      arc.setAttribute('stroke-width', '16');
      arc.setAttribute('stroke-linecap', 'round');
      arc.setAttribute('stroke-dasharray', `${dash} ${C - dash}`);
      arc.setAttribute('stroke-dashoffset', String(-offset));
      arc.setAttribute('transform', 'rotate(-90 100 100)');
      arc.setAttribute('filter', 'url(#o-glow)');
      arc.style.transition = 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease';
      svg.appendChild(arc);
      offset += dash + gap;
    });
  },

  // ─── Profil Menü Şirket Listesi ───
  profilMenuGuncelle() {
    const container = document.getElementById('sirket-menu-listesi');
    if (!container) return;
    const sirketler = this.tumSirketler || [];
    const aktifId = API.getSirketId();

    if (sirketler.length <= 1) {
      container.classList.add('hidden');
      return;
    }
    container.classList.remove('hidden');
    container.innerHTML = sirketler.map(s => `
      <button class="sirket-menu-item w-full text-left px-4 py-2 text-sm transition flex items-center gap-2 ${s.id === aktifId ? 'text-brand font-semibold bg-brand/5' : 'text-gray-600 hover:bg-gray-50'}" data-id="${s.id}">
        ${s.id === aktifId ? '<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>' : '<span class="w-3.5"></span>'}
        <span class="truncate">${this.esc(s.isim)}</span>
      </button>
    `).join('');
  },

  // ─── Yardımcılar ───
  modalAc(id) { document.getElementById(id).classList.add('open'); },
  modalKapat(id) { document.getElementById(id).classList.remove('open'); },

  varsayilanTarih() {
    const el = document.getElementById('tx-date');
    if (el) el.value = new Date().toISOString().split('T')[0];
  },

  formatPara(n) {
    const locale = i18n.dil === 'en' ? 'en-US' : 'tr-TR';
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(n || 0);
  },

  rolGoster(rol) {
    return t('rol.' + rol) || rol;
  },

  durumGoster(durum) {
    return t('durum.' + durum) || durum;
  },

  esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
