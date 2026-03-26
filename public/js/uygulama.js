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
        profilMenu.classList.toggle('hidden');
      });

      profilMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const btn = e.target.closest('button');
        if (!btn) return;
        profilMenu.classList.add('hidden');

        if (btn.id === 'btn-sirket-degistir') {
          if (window.GercekZaman) GercekZaman.durdur();
          API.setSirketId(null);
          App._appBound = false;
          App.ekranGoster('sirket');
          App.bindSirketSecici();
        } else if (btn.id === 'btn-ayarlar-menu') {
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

      // Şirket Değiştir: sadece birden fazla şirket varsa göster
      const btnSirketDegistir = document.getElementById('btn-sirket-degistir');
      if (btnSirketDegistir) {
        btnSirketDegistir.classList.toggle('hidden', (this.sirketSayisi || 0) <= 1);
      }

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
    // Eski arc'ları temizle (circle ve text kalsın)
    svg.querySelectorAll('.o-arc').forEach(el => el.remove());

    const toplam = ozet.toplamHarcama || 0;
    if (toplam <= 0) return;

    const R = 50, C = 2 * Math.PI * R;
    let offset = 0;

    // Üye harcamaları
    const parcalar = [];
    ozet.uyeler.forEach(u => {
      const tutar = ozet.harcamalar[u.id] || 0;
      if (tutar > 0) parcalar.push({ renk: u.renk, tutar });
    });
    // Kasa harcaması
    if (ozet.kasaHarcama > 0) {
      parcalar.push({ renk: '#6366f1', tutar: ozet.kasaHarcama });
    }

    const text = svg.querySelector('text');
    parcalar.forEach(p => {
      const oran = p.tutar / toplam;
      const dash = oran * C;
      const arc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      arc.setAttribute('class', 'o-arc');
      arc.setAttribute('cx', '60');
      arc.setAttribute('cy', '60');
      arc.setAttribute('r', String(R));
      arc.setAttribute('fill', 'none');
      arc.setAttribute('stroke', p.renk);
      arc.setAttribute('stroke-width', '12');
      arc.setAttribute('stroke-dasharray', `${dash} ${C - dash}`);
      arc.setAttribute('stroke-dashoffset', String(-offset));
      arc.setAttribute('transform', 'rotate(-90 60 60)');
      svg.insertBefore(arc, text);
      offset += dash;
    });
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
