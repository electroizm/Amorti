/**
 * API İstemcisi
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
      const err = await res.json().catch(() => ({ error: 'Bir hata oluştu' }));
      throw new Error(err.error);
    }
    return res.json();
  },

  // Partners
  getPartners() { return this.request('/partners'); },
  addPartner(data) { return this.request('/partners', { method: 'POST', body: data }); },
  updatePartner(id, data) { return this.request(`/partners/${id}`, { method: 'PATCH', body: data }); },
  deletePartner(id) { return this.request(`/partners/${id}`, { method: 'DELETE' }); },

  // Transactions
  getTransactions() { return this.request('/transactions'); },
  addTransaction(data) { return this.request('/transactions', { method: 'POST', body: data }); },
  deleteTransaction(id) { return this.request(`/transactions/${id}`, { method: 'DELETE' }); },

  // Summary
  getSummary() { return this.request('/summary'); }
};
