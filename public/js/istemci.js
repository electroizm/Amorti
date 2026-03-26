/**
 * AMORT! API Istemcisi
 * Auth token + sirket baglami yonetimi
 */
const API = {
  base: '/api',

  // --- Token & Oturum ---
  getToken() {
    const oturum = JSON.parse(localStorage.getItem('amort-oturum') || 'null');
    return oturum?.access_token || null;
  },

  setOturum(oturum) {
    localStorage.setItem('amort-oturum', JSON.stringify(oturum));
  },

  temizleOturum() {
    localStorage.removeItem('amort-oturum');
    localStorage.removeItem('amort-kullanici');
    localStorage.removeItem('amort-sirket');
  },

  getKullanici() {
    return JSON.parse(localStorage.getItem('amort-kullanici') || 'null');
  },

  setKullanici(k) {
    localStorage.setItem('amort-kullanici', JSON.stringify(k));
  },

  getSirketId() {
    return localStorage.getItem('amort-sirket') || null;
  },

  setSirketId(id) {
    localStorage.setItem('amort-sirket', id);
  },

  girisYapildiMi() {
    return !!this.getToken();
  },

  // --- HTTP ---
  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json' };

    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const sirketId = this.getSirketId();
    if (sirketId) headers['X-Sirket-Id'] = sirketId;

    const res = await fetch(this.base + path, {
      headers,
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (res.status === 401) {
      this.temizleOturum();
      window.location.reload();
      throw new Error('Oturum suresi doldu');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ hata: 'Bir hata olustu' }));
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

  // --- Islemler ---
  getIslemler() { return this.request('/islemler'); },
  addIslem(data) { return this.request('/islemler', { method: 'POST', body: data }); },
  deleteIslem(id) { return this.request(`/islemler/${id}`, { method: 'DELETE' }); },

  // --- Ozet ---
  getOzet() { return this.request('/ozet'); }
};
