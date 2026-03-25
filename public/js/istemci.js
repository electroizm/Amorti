/**
 * API İstemcisi (Türkçe endpoint'ler)
 */
const API = {
  base: '/api',

  async request(path, options = {}) {
    const res = await fetch(this.base + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ hata: 'Bir hata oluştu' }));
      throw new Error(err.hata);
    }
    return res.json();
  },

  // Ortaklar
  getOrtaklar() { return this.request('/ortaklar'); },
  addOrtak(data) { return this.request('/ortaklar', { method: 'POST', body: data }); },
  updateOrtak(id, data) { return this.request(`/ortaklar/${id}`, { method: 'PATCH', body: data }); },
  deleteOrtak(id) { return this.request(`/ortaklar/${id}`, { method: 'DELETE' }); },

  // İşlemler
  getIslemler() { return this.request('/islemler'); },
  addIslem(data) { return this.request('/islemler', { method: 'POST', body: data }); },
  deleteIslem(id) { return this.request(`/islemler/${id}`, { method: 'DELETE' }); },

  // Özet
  getOzet() { return this.request('/ozet'); }
};
