/**
 * AMØRT! Ana Uygulama Orkestratörü (ES Module)
 */
import { i18n, t } from './dil/i18n.js';
import { API } from './api.js';
import { ikonlariGuncelle } from './ikonlar.js';
import { CevrimdisiKuyruk } from './modul/cevrimdisi.js';
import { GercekZaman } from './modul/gercek-zaman.js';

// Modül kurucuları
import { authEkranKur } from './modul/auth-ekran.js';
import { sirketEkranKur } from './modul/sirket-ekran.js';
import { ozetPanelKur } from './modul/ozet-panel.js';
import { islemKartiKur } from './modul/islem-karti.js';
import { uyeKartiKur } from './modul/uye-karti.js';
import { ayarlarEkranKur } from './modul/ayarlar-ekran.js';
import { copKutusuKur } from './modul/cop-kutusu.js';

const App = {
  mevcutSayfa: 'home',
  islemTuru: 'harcama',
  uyeler: [],
  ortaklar: [],
  rol: null,
  sirketSayisi: 0,
  sirketIsim: '',
  sirketTip: 'ortaklik',

  async init() {
    i18n.init();
    CevrimdisiKuyruk.init(this, API);

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
  _toastKilidi: {},

  toast(mesaj, tip = 'basari') {
    // Aynı hata mesajı 5sn içinde tekrar gösterilmesin
    if (tip === 'hata') {
      const anahtar = mesaj.trim();
      if (this._toastKilidi[anahtar]) return;
      this._toastKilidi[anahtar] = true;
      setTimeout(() => { delete this._toastKilidi[anahtar]; }, 5200);
    }

    const sure = tip === 'hata' ? 5200 : 2600;
    const animSure = (sure - 400) / 1000;

    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast toast-${tip}`;
    el.style.animationDuration = `0.3s, 0.3s`;
    el.style.animationDelay = `0s, ${animSure}s`;
    el.textContent = mesaj;
    container.appendChild(el);
    setTimeout(() => el.remove(), sure);
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

    // Profil menü
    if (!this._profilMenuBound) {
      this._profilMenuBound = true;
      const profilMenu = document.getElementById('profil-menu');

      document.getElementById('btn-profil').addEventListener('click', (e) => {
        e.stopPropagation();
        this.profilMenuGuncelle();
        profilMenu.classList.toggle('hidden');
      });

      profilMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const btn = e.target.closest('button');
        if (!btn) return;

        if (btn.classList.contains('sirket-menu-item')) {
          const id = btn.dataset.id;
          if (id !== API.getSirketId()) {
            GercekZaman.durdur();
            API.setSirketId(id);
            this.yenile();
            this.realtimeBaslat();
          }
          profilMenu.classList.add('hidden');
          return;
        }

        profilMenu.classList.add('hidden');
        if (btn.id === 'btn-ayarlar-menu') {
          this.navigate('settings');
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

    if (sayfa === 'partners') {
      // Bireysel kasada ortaklar sekmesi yok
      const ortaklarTab = document.querySelector('.partner-tab[data-tab="ortaklar"]');
      if (ortaklarTab) ortaklarTab.classList.toggle('hidden', this.sirketTip === 'bireysel');
      this.uyeListesiGoster();
    }
    if (sayfa === 'transactions') this.islemListesiGoster();
  },

  // ─── Veri Yenileme ───
  async yenile() {
    try {
      const ozet = await API.getOzet();
      this.uyeler = ozet.uyeler;
      this.ortaklar = ozet.ortaklar || [];
      this.rol = ozet.rol;
      this.sirketIsim = ozet.sirketIsim || '';
      this.sirketTip = ozet.sirketTip || 'ortaklik';

      // Özet kartı
      const kasaBadge = document.getElementById('ozet-kasa-badge');
      const ozetLabel = document.getElementById('ozet-toplam-label');

      if (this.sirketTip === 'bireysel') {
        const bakiye = ozet.netBakiye || 0;
        document.getElementById('ozet-toplam').textContent = this.formatPara(bakiye) + ' ₺';
        document.getElementById('ozet-toplam').style.color = bakiye < 0 ? '#ef4444' : '';
        if (ozetLabel) ozetLabel.textContent = t('bireysel.netBakiye');
        kasaBadge.classList.add('hidden');
        document.getElementById('ozet-alt').textContent = '';

        // Bireysel stat kartları
        const bs = document.getElementById('bireysel-section');
        if (bs) {
          bs.classList.remove('hidden');
          document.getElementById('bireysel-gelir').textContent = this.formatPara(ozet.toplamGelir) + ' ₺';
          document.getElementById('bireysel-gider').textContent = this.formatPara(ozet.toplamGider) + ' ₺';
          const bakiyeEl = document.getElementById('bireysel-bakiye');
          if (bakiyeEl) {
            bakiyeEl.textContent = (bakiye >= 0 ? '+' : '') + this.formatPara(bakiye) + ' ₺';
            bakiyeEl.className = `text-base font-black ${bakiye >= 0 ? 'text-green-600' : 'text-red-500'}`;
          }
        }
      } else {
        document.getElementById('ozet-toplam').textContent = this.formatPara(ozet.toplamHarcama) + ' ₺';
        document.getElementById('ozet-toplam').style.color = '';
        if (ozetLabel) ozetLabel.textContent = t('ozet.toplamHarcama');
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
        document.getElementById('bireysel-section')?.classList.add('hidden');
      }

      this.ortakKartlariGoster(ozet);
      this.borcBolumuGoster(ozet);
      this.oRingGuncelle(ozet);
      this.selectGuncelle();

      // Kullanıcı bilgisi
      const kullanici = API.getKullanici();
      document.getElementById('ayar-kullanici').textContent = kullanici ? `${kullanici.isim} (${kullanici.eposta})` : '';
      document.getElementById('ayar-rol').textContent = t('ayarlar.rol', { rol: this.rolGoster(this.rol) });

      // Boş durum
      const bos = document.getElementById('empty-state');
      const bireyselBos = this.sirketTip === 'bireysel' && (ozet.toplamGelir || 0) === 0 && (ozet.toplamGider || 0) === 0;
      const ortaklikBos = this.sirketTip !== 'bireysel' && !(ozet.uyeler.length > 0 && ozet.toplamHarcama > 0);
      const bosGoster = bireyselBos || ortaklikBos;
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

      this.profilMenuGuncelle();
      this.ayarlariYukle();
      if (this.copKutusuYukle) this.copKutusuYukle();

      ikonlariGuncelle();
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
    try {
      const token = API.getToken();
      const sirketId = API.getSirketId();
      if (token && sirketId) {
        GercekZaman._app = this;
        await GercekZaman.baslat(token, sirketId);
      }
    } catch (err) { console.warn('Realtime baslatilamadi:', err); }
  },

  // ─── Ø Ring ───
  oRingGuncelle(ozet) {
    const svg = document.getElementById('o-ring');
    svg.querySelectorAll('.o-arc').forEach(el => el.remove());

    const slash = svg.querySelector('.o-slash');
    const toplam = ozet.sirketTip === 'bireysel'
      ? (ozet.toplamGelir || 0) + (ozet.toplamGider || 0)
      : (ozet.toplamHarcama || 0);

    if (toplam <= 0) {
      if (slash) slash.setAttribute('opacity', '0.25');
      return;
    }
    if (slash) slash.setAttribute('opacity', '0.15');

    const R = 78, C = 2 * Math.PI * R;
    let offset = 0;

    const parcalar = [];
    if (ozet.sirketTip === 'bireysel') {
      if ((ozet.toplamGelir || 0) > 0) parcalar.push({ renk: '#10b981', tutar: ozet.toplamGelir });
      if ((ozet.toplamGider || 0) > 0) parcalar.push({ renk: '#ef4444', tutar: ozet.toplamGider });
    } else {
      const ortaklar = ozet.ortaklar || [];
      if (ortaklar.length > 0) {
        ortaklar.forEach(o => {
          const tutar = (ozet.ortakHarcamalar || {})[o.id] || 0;
          if (tutar > 0) parcalar.push({ renk: o.renk, tutar });
        });
      } else {
        ozet.uyeler.forEach(u => {
          const tutar = ozet.harcamalar[u.id] || 0;
          if (tutar > 0) parcalar.push({ renk: u.renk, tutar });
        });
      }
      if (ozet.kasaHarcama > 0) {
        parcalar.push({ renk: '#6366f1', tutar: ozet.kasaHarcama });
      }
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

  // ─── Profil Menü ───
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
        ${s.id === aktifId ? '<i data-lucide="check" class="w-3.5 h-3.5 flex-shrink-0"></i>' : '<span class="w-3.5"></span>'}
        <span class="truncate">${this.esc(s.isim)}</span>
      </button>
    `).join('');
    ikonlariGuncelle();
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

// Modülleri kur
authEkranKur(App);
sirketEkranKur(App);
ozetPanelKur(App);
islemKartiKur(App);
uyeKartiKur(App);
ayarlarEkranKur(App);
copKutusuKur(App);

export default App;
