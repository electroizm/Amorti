/**
 * AMORT! API Istemcisi
 * Auth token + sirket baglami yonetimi
 */
const API = {
  base: '/api',
  _depolama: 'local',

  // --- Depolama Modu ---
  setDepolamaModu(mod) {
    this._depolama = mod; // 'local' veya 'session'
  },

  _getDepo() {
    return this._depolama === 'session' ? sessionStorage : localStorage;
  },

  // --- Token & Oturum ---
  getToken() {
    const oturum = JSON.parse(this._getDepo().getItem('amort-oturum') || 'null');
    return oturum?.access_token || null;
  },

  setOturum(oturum) {
    this._getDepo().setItem('amort-oturum', JSON.stringify(oturum));
  },

  temizleOturum() {
    localStorage.removeItem('amort-oturum');
    localStorage.removeItem('amort-kullanici');
    localStorage.removeItem('amort-sirket');
    sessionStorage.removeItem('amort-oturum');
    sessionStorage.removeItem('amort-kullanici');
    sessionStorage.removeItem('amort-sirket');
  },

  getKullanici() {
    return JSON.parse(this._getDepo().getItem('amort-kullanici') || 'null');
  },

  setKullanici(k) {
    this._getDepo().setItem('amort-kullanici', JSON.stringify(k));
  },

  getSirketId() {
    return this._getDepo().getItem('amort-sirket') || null;
  },

  setSirketId(id) {
    this._getDepo().setItem('amort-sirket', id);
  },

  girisYapildiMi() {
    // Her iki storage'ı kontrol et
    const local = JSON.parse(localStorage.getItem('amort-oturum') || 'null');
    if (local?.access_token) { this._depolama = 'local'; return true; }
    const session = JSON.parse(sessionStorage.getItem('amort-oturum') || 'null');
    if (session?.access_token) { this._depolama = 'session'; return true; }
    return false;
  },

  // --- HTTP ---
  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json' };

    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const sirketId = this.getSirketId();
    if (sirketId) headers['X-Sirket-Id'] = sirketId;

    let res;
    try {
      res = await fetch(this.base + path, {
        headers,
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined
      });
    } catch (fetchErr) {
      throw new Error(window.HataSanitize ? HataSanitize.cevir(fetchErr.message) : fetchErr.message);
    }

    if (res.status === 401 && !path.startsWith('/auth/')) {
      this.temizleOturum();
      window.location.reload();
      throw new Error(t('hata.oturumDoldu'));
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ hata: t('hata.genelHata') }));
      throw new Error(err.hata);
    }
    return res.json();
  },

  // --- Auth ---
  async kayit(isim, eposta, sifre) {
    const data = await this.request('/auth/kayit', {
      method: 'POST',
      body: { isim, eposta, sifre }
    });
    if (data.oturum) {
      this.setOturum(data.oturum);
      this.setKullanici(data.kullanici);
    }
    return data;
  },

  async giris(eposta, sifre) {
    const data = await this.request('/auth/giris', {
      method: 'POST',
      body: { eposta, sifre }
    });
    if (data.oturum) {
      this.setOturum(data.oturum);
      this.setKullanici(data.kullanici);
    }
    return data;
  },

  async cikis() {
    try {
      await this.request('/auth/cikis', { method: 'POST' });
    } catch (e) { /* ignore */ }
    this.temizleOturum();
  },

  // --- Sirketler ---
  getSirketler() { return this.request('/sirketler'); },
  sirketOlustur(isim) { return this.request('/sirketler', { method: 'POST', body: { isim } }); },
  sirketGuncelle(id, isim) { return this.request(`/sirketler/${id}`, { method: 'PATCH', body: { isim } }); },
  sirketSil(id) { return this.request(`/sirketler/${id}`, { method: 'DELETE' }); },
  sirketGizle(id) { return this.request(`/sirketler/${id}/gizle`, { method: 'PATCH' }); },
  sirketGoster(id) { return this.request(`/sirketler/${id}/goster`, { method: 'PATCH' }); },
  getSirketlerHepsi() { return this.request('/sirketler?dahilGizli=true'); },

  // --- Ortaklar ---
  getOrtaklar() { return this.request('/ortaklar'); },
  ortakEkle(data) { return this.request('/ortaklar', { method: 'POST', body: data }); },
  ortakGuncelle(id, data) { return this.request(`/ortaklar/${id}`, { method: 'PATCH', body: data }); },
  ortakSil(id, hedefOrtakId) { return this.request(`/ortaklar/${id}`, { method: 'DELETE', body: { hedef_ortak_id: hedefOrtakId || null } }); },

  // --- Davetler ---
  davetGonder(eposta, rol) { return this.request('/davetler', { method: 'POST', body: { eposta, rol } }); },
  davetListele() { return this.request('/davetler'); },
  bekleyenDavetler() { return this.request('/davetler/bekleyen'); },
  davetKabul(id) { return this.request(`/davetler/${id}/kabul`, { method: 'POST' }); },
  davetRed(id) { return this.request(`/davetler/${id}/red`, { method: 'POST' }); },

  // --- Uyeler ---
  getUyeler() { return this.request('/uyeler'); },
  uyeGuncelle(id, data) { return this.request(`/uyeler/${id}`, { method: 'PATCH', body: data }); },
  uyeRolDegistir(id, rol) { return this.request(`/uyeler/${id}/rol`, { method: 'PATCH', body: { rol } }); },
  uyeSil(id) { return this.request(`/uyeler/${id}`, { method: 'DELETE' }); },
  silinmisUyeler() { return this.request('/uyeler/cop'); },
  uyeGeriAl(id) { return this.request(`/uyeler/${id}/geriAl`, { method: 'PATCH' }); },

  // --- Islemler ---
  getIslemler() { return this.request('/islemler'); },
  async addIslem(data) {
    if (!navigator.onLine && window.CevrimdisiKuyruk) {
      CevrimdisiKuyruk.ekle('/islemler', { method: 'POST', body: data });
      return { kuyrukta: true };
    }
    return this.request('/islemler', { method: 'POST', body: data });
  },
  deleteIslem(id) { return this.request(`/islemler/${id}`, { method: 'DELETE' }); },
  silinmisIslemler() { return this.request('/islemler/cop'); },
  islemGeriAl(id) { return this.request(`/islemler/${id}/geriAl`, { method: 'PATCH' }); },

  // --- Ayarlar ---
  getAyarlar() { return this.request('/ayarlar'); },
  ayarlarGuncelle(data) { return this.request('/ayarlar', { method: 'PATCH', body: data }); },

  // --- Ozet ---
  getOzet() { return this.request('/ozet'); }
};
