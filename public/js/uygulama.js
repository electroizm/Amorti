/**
 * AMØRT! Ana Uygulama Mantığı
 * Toast bildirimleri, vibrasyon, animasyonlar
 */
const App = {
  mevcutSayfa: 'home',
  islemTuru: 'harcama',
  ortaklar: [],
  duzenlenenOrtakId: null,

  async init() {
    Ring.init();
    this.bindNavigation();
    this.bindFAB();
    this.bindIslemModal();
    this.bindOrtakModal();
    this.bindTema();
    this.varsayilanTarih();
    await this.yenile();
  },

  // ─── Toast Bildirimi ───
  toast(mesaj, tip = 'basari') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast toast-${tip}`;
    el.textContent = mesaj;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  },

  // ─── Vibrasyon ───
  titresim(ms = 50) {
    if (navigator.vibrate) navigator.vibrate(ms);
  },

  // ─── Navigasyon ───
  bindNavigation() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this.navigate(btn.dataset.page);
      });
    });
  },

  navigate(sayfa) {
    this.mevcutSayfa = sayfa;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${sayfa}`).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${sayfa}"]`).classList.add('active');

    const fab = document.getElementById('fab');
    fab.style.display = (sayfa === 'home' || sayfa === 'transactions') ? 'flex' : 'none';

    if (sayfa === 'partners') this.ortakListesiGoster();
    if (sayfa === 'transactions') this.islemListesiGoster();
  },

  // ─── Veri Yenileme ───
  async yenile() {
    try {
      const ozet = await API.getOzet();
      this.ortaklar = ozet.ortaklar;
      Ring.update(ozet.ortaklar, ozet.harcamalar, ozet.toplamHarcama);
      this.ortakKartlariGoster(ozet);
      this.borcBolumuGoster(ozet);
      this.selectGuncelle();

      const bos = document.getElementById('empty-state');
      if (ozet.ortaklar.length === 0) {
        bos.classList.remove('hidden');
      } else {
        bos.classList.add('hidden');
      }
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    }
  },

  // ─── Ana Sayfa: Ortak Kartları ───
  ortakKartlariGoster(ozet) {
    const container = document.getElementById('partner-cards');
    if (ozet.ortaklar.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = ozet.ortaklar.map(o => {
      const harcanan = ozet.harcamalar[o.id] || 0;
      const bakiye = ozet.bakiyeler[o.id] || 0;
      const bakiyeClass = bakiye > 0 ? 'text-emerald-400' : bakiye < 0 ? 'text-red-400' : 'text-gray-400';
      const bakiyeLabel = bakiye > 0 ? 'alacaklı' : bakiye < 0 ? 'borçlu' : 'eşit';

      return `
        <div class="bg-surface rounded-xl p-4 border-l-4" style="border-color: ${o.renk}">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-3 h-3 rounded-full" style="background: ${o.renk}"></div>
            <span class="font-semibold text-sm">${this.esc(o.isim)}</span>
          </div>
          <p class="text-lg font-bold">${Ring.formatPara(harcanan)} ₺</p>
          <p class="text-xs ${bakiyeClass}">${bakiye > 0 ? '+' : ''}${Ring.formatPara(bakiye)} ₺ ${bakiyeLabel}</p>
        </div>
      `;
    }).join('');
  },

  // ─── Ana Sayfa: Borç Önerileri (animasyonlu ok) ───
  borcBolumuGoster(ozet) {
    const section = document.getElementById('debt-section');
    const container = document.getElementById('debt-transfers');

    if (ozet.onerilen_transferler.length === 0) {
      section.classList.add('hidden');
      return;
    }
    section.classList.remove('hidden');

    const ortakMap = {};
    ozet.ortaklar.forEach(o => { ortakMap[o.id] = o; });

    container.innerHTML = ozet.onerilen_transferler.map(t => {
      const kimden = ortakMap[t.kimden];
      const kime = ortakMap[t.kime];
      return `
        <div class="transfer-card rounded-xl p-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" style="background: ${kimden.renk}"></div>
            <span class="font-medium text-sm">${this.esc(kimden.isim)}</span>
            <div class="transfer-arrow w-6 h-5 flex items-center justify-center">
              <svg class="w-4 h-4 text-brand-light" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </div>
            <div class="w-3 h-3 rounded-full" style="background: ${kime.renk}"></div>
            <span class="font-medium text-sm">${this.esc(kime.isim)}</span>
          </div>
          <span class="font-bold text-brand-light">${Ring.formatPara(t.tutar)} ₺</span>
        </div>
      `;
    }).join('');
  },

  // ─── Select Güncelle ───
  selectGuncelle() {
    const options = this.ortaklar.map(o =>
      `<option value="${o.id}">${this.esc(o.isim)}</option>`
    ).join('');

    document.getElementById('tx-payer').innerHTML = options || '<option value="">Önce ortak ekleyin</option>';
    document.getElementById('tx-receiver').innerHTML = options || '<option value="">Önce ortak ekleyin</option>';
  },

  // ─── FAB ───
  bindFAB() {
    document.getElementById('fab').addEventListener('click', () => {
      if (this.ortaklar.length < 1) {
        this.toast('Önce en az bir ortak ekleyin!', 'hata');
        this.titresim(100);
        this.navigate('partners');
        return;
      }
      this.modalAc('modal-tx');
    });
  },

  // ─── İşlem Modal ───
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
        document.getElementById('tx-receiver-group').classList.toggle('hidden', this.islemTuru !== 'transfer');
      });
    });

    document.getElementById('form-tx').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        tur: this.islemTuru,
        odeyen_id: document.getElementById('tx-payer').value,
        tutar: parseFloat(document.getElementById('tx-amount').value),
        aciklama: document.getElementById('tx-desc').value,
        tarih: document.getElementById('tx-date').value
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
        this.toast(this.islemTuru === 'transfer' ? 'Transfer kaydedildi' : 'Harcama eklendi', 'basari');
        await this.yenile();
      } catch (err) {
        this.toast('Hata: ' + err.message, 'hata');
        this.titresim(100);
      }
    });
  },

  // ─── Ortak Modal ───
  bindOrtakModal() {
    document.getElementById('btn-add-partner').addEventListener('click', () => {
      this.duzenlenenOrtakId = null;
      document.getElementById('partner-modal-title').textContent = 'Yeni Ortak';
      document.getElementById('form-partner').reset();
      document.getElementById('partner-color').value = this.varsayilanRenk();
      document.getElementById('partner-color-label').textContent = this.varsayilanRenk();
      this.modalAc('modal-partner');
    });

    document.getElementById('modal-partner-close').addEventListener('click', () => this.modalKapat('modal-partner'));
    document.getElementById('modal-partner').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.modalKapat('modal-partner');
    });

    document.getElementById('partner-color').addEventListener('input', (e) => {
      document.getElementById('partner-color-label').textContent = e.target.value;
    });

    document.getElementById('form-partner').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        isim: document.getElementById('partner-name').value.trim(),
        renk: document.getElementById('partner-color').value
      };

      try {
        if (this.duzenlenenOrtakId) {
          await API.updateOrtak(this.duzenlenenOrtakId, data);
          this.toast('Ortak güncellendi', 'basari');
        } else {
          await API.addOrtak(data);
          this.toast(`${data.isim} eklendi`, 'basari');
        }
        this.titresim();
        this.modalKapat('modal-partner');
        await this.yenile();
        this.ortakListesiGoster();
      } catch (err) {
        this.toast('Hata: ' + err.message, 'hata');
        this.titresim(100);
      }
    });
  },

  // ─── Ortak Listesi ───
  async ortakListesiGoster() {
    const list = document.getElementById('partner-list');
    const empty = document.getElementById('partner-empty');

    try {
      const ortaklar = await API.getOrtaklar();
      if (ortaklar.length === 0) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
        return;
      }
      empty.classList.add('hidden');

      list.innerHTML = ortaklar.map(o => `
        <div class="bg-surface rounded-xl p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full" style="background: ${o.renk}"></div>
            <div>
              <p class="font-semibold">${this.esc(o.isim)}</p>
              <p class="text-xs text-gray-400">${o.renk}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="App.ortakDuzenle('${o.id}')" class="p-2 rounded-lg hover:bg-surface-light/50 text-gray-400 hover:text-white transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button onclick="App.ortakSil('${o.id}')" class="p-2 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error(err);
    }
  },

  async ortakDuzenle(id) {
    const ortak = this.ortaklar.find(o => o.id === id);
    if (!ortak) return;
    this.duzenlenenOrtakId = id;
    document.getElementById('partner-modal-title').textContent = 'Ortağı Düzenle';
    document.getElementById('partner-name').value = ortak.isim;
    document.getElementById('partner-color').value = ortak.renk;
    document.getElementById('partner-color-label').textContent = ortak.renk;
    this.modalAc('modal-partner');
  },

  async ortakSil(id) {
    const ortak = this.ortaklar.find(o => o.id === id);
    if (!ortak) return;
    if (!confirm(`"${ortak.isim}" ortağını silmek istediğinize emin misiniz?`)) return;

    try {
      await API.deleteOrtak(id);
      this.titresim();
      this.toast(`${ortak.isim} silindi`, 'bilgi');
      await this.yenile();
      this.ortakListesiGoster();
    } catch (err) {
      this.toast('Hata: ' + err.message, 'hata');
    }
  },

  // ─── İşlem Listesi ───
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

      const ortakMap = {};
      this.ortaklar.forEach(o => { ortakMap[o.id] = o; });

      list.innerHTML = islemler.slice().reverse().map(i => {
        const odeyen = ortakMap[i.odeyen_id] || { isim: '?', renk: '#666' };
        const transferMi = i.tur === 'transfer';
        const alan = transferMi ? (ortakMap[i.alan_id] || { isim: '?', renk: '#666' }) : null;

        return `
          <div class="bg-surface rounded-xl p-4">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" style="background: ${odeyen.renk}"></div>
                <span class="font-medium text-sm">${this.esc(odeyen.isim)}</span>
                ${transferMi ? `
                  <svg class="w-4 h-4 text-brand-light" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  <div class="w-3 h-3 rounded-full" style="background: ${alan.renk}"></div>
                  <span class="font-medium text-sm">${this.esc(alan.isim)}</span>
                ` : ''}
              </div>
              <span class="font-bold">${Ring.formatPara(i.tutar)} ₺</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xs px-2 py-0.5 rounded-full ${transferMi ? 'bg-brand/20 text-brand-light' : 'bg-emerald-900/30 text-emerald-400'}">${transferMi ? 'Transfer' : 'Harcama'}</span>
                ${i.aciklama ? `<span class="text-xs text-gray-400">${this.esc(i.aciklama)}</span>` : ''}
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500">${i.tarih}</span>
                <button onclick="App.islemSil(${i.id})" class="p-1 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
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

  // ─── Tema ───
  bindTema() {
    const html = document.documentElement;
    const kayitli = localStorage.getItem('amort-theme') || 'dark';
    if (kayitli === 'light') html.classList.remove('dark');

    document.getElementById('btn-theme').addEventListener('click', () => this.temaDegistir());
    document.getElementById('toggle-dark').addEventListener('click', () => this.temaDegistir());
  },

  temaDegistir() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    const koyuMu = html.classList.contains('dark');
    localStorage.setItem('amort-theme', koyuMu ? 'dark' : 'light');

    const hole = document.querySelector('.ring-hole');
    const slash = document.querySelector('.ring-slash');
    if (koyuMu) {
      hole.style.background = '#0f172a';
      slash.style.background = '#0f172a';
      document.querySelector('meta[name="theme-color"]').content = '#0f172a';
    } else {
      hole.style.background = '#f8fafc';
      slash.style.background = '#f8fafc';
      document.querySelector('meta[name="theme-color"]').content = '#f8fafc';
    }
  },

  // ─── Yardımcılar ───
  modalAc(id) {
    document.getElementById(id).classList.add('open');
  },

  modalKapat(id) {
    document.getElementById(id).classList.remove('open');
  },

  varsayilanTarih() {
    document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
  },

  varsayilanRenk() {
    const renkler = ['#FDE047', '#1E3A8A', '#10B981', '#F97316', '#EC4899', '#8B5CF6', '#06B6D4'];
    return renkler[this.ortaklar.length % renkler.length];
  },

  esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

// Başlat
document.addEventListener('DOMContentLoaded', () => App.init());
