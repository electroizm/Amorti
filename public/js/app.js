/**
 * AMØRT! Ana Uygulama Mantığı
 */
const App = {
  currentPage: 'home',
  txType: 'harcama',
  partners: [],
  editingPartnerId: null,

  async init() {
    Ring.init();
    this.bindNavigation();
    this.bindFAB();
    this.bindTxModal();
    this.bindPartnerModal();
    this.bindTheme();
    this.setDefaultDate();
    await this.refresh();
  },

  // ─── Navigasyon ───
  bindNavigation() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        this.navigate(page);
      });
    });
  },

  navigate(page) {
    this.currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${page}"]`).classList.add('active');

    // FAB sadece home ve transactions'da görünsün
    const fab = document.getElementById('fab');
    fab.style.display = (page === 'home' || page === 'transactions') ? 'flex' : 'none';

    if (page === 'partners') this.renderPartnerList();
    if (page === 'transactions') this.renderTransactionList();
  },

  // ─── Veri Yenileme ───
  async refresh() {
    try {
      const summary = await API.getSummary();
      this.partners = summary.partners;
      Ring.update(summary.partners, summary.spending, summary.totalSpending);
      this.renderPartnerCards(summary);
      this.renderDebtSection(summary);
      this.updateSelectOptions();

      // Boş durum
      const empty = document.getElementById('empty-state');
      if (summary.partners.length === 0) {
        empty.classList.remove('hidden');
      } else {
        empty.classList.add('hidden');
      }
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    }
  },

  // ─── Ana Sayfa: Ortak Kartları ───
  renderPartnerCards(summary) {
    const container = document.getElementById('partner-cards');
    if (summary.partners.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = summary.partners.map(p => {
      const spent = summary.spending[p.id] || 0;
      const balance = summary.balances[p.id] || 0;
      const balanceClass = balance > 0 ? 'text-emerald-400' : balance < 0 ? 'text-red-400' : 'text-gray-400';
      const balanceLabel = balance > 0 ? 'alacaklı' : balance < 0 ? 'borçlu' : 'eşit';

      return `
        <div class="bg-surface rounded-xl p-4 border-l-4" style="border-color: ${p.color}">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-3 h-3 rounded-full" style="background: ${p.color}"></div>
            <span class="font-semibold text-sm">${this.esc(p.name)}</span>
          </div>
          <p class="text-lg font-bold">${Ring.formatMoney(spent)} ₺</p>
          <p class="text-xs ${balanceClass}">${balance > 0 ? '+' : ''}${Ring.formatMoney(balance)} ₺ ${balanceLabel}</p>
        </div>
      `;
    }).join('');
  },

  // ─── Ana Sayfa: Borç Önerileri ───
  renderDebtSection(summary) {
    const section = document.getElementById('debt-section');
    const container = document.getElementById('debt-transfers');

    if (summary.suggestedTransfers.length === 0) {
      section.classList.add('hidden');
      return;
    }
    section.classList.remove('hidden');

    const partnerMap = {};
    summary.partners.forEach(p => { partnerMap[p.id] = p; });

    container.innerHTML = summary.suggestedTransfers.map(t => {
      const from = partnerMap[t.from];
      const to = partnerMap[t.to];
      return `
        <div class="transfer-card rounded-xl p-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" style="background: ${from.color}"></div>
            <span class="font-medium text-sm">${this.esc(from.name)}</span>
            <svg class="w-4 h-4 text-brand-light" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            <div class="w-3 h-3 rounded-full" style="background: ${to.color}"></div>
            <span class="font-medium text-sm">${this.esc(to.name)}</span>
          </div>
          <span class="font-bold text-brand-light">${Ring.formatMoney(t.amount)} ₺</span>
        </div>
      `;
    }).join('');
  },

  // ─── Select Güncelle ───
  updateSelectOptions() {
    const options = this.partners.map(p =>
      `<option value="${p.id}">${this.esc(p.name)}</option>`
    ).join('');

    document.getElementById('tx-payer').innerHTML = options || '<option value="">Önce ortak ekleyin</option>';
    document.getElementById('tx-receiver').innerHTML = options || '<option value="">Önce ortak ekleyin</option>';
  },

  // ─── FAB ───
  bindFAB() {
    document.getElementById('fab').addEventListener('click', () => {
      if (this.partners.length < 1) {
        alert('Önce en az bir ortak ekleyin!');
        this.navigate('partners');
        return;
      }
      this.openModal('modal-tx');
    });
  },

  // ─── İşlem Modal ───
  bindTxModal() {
    document.getElementById('modal-tx-close').addEventListener('click', () => this.closeModal('modal-tx'));
    document.getElementById('modal-tx').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.closeModal('modal-tx');
    });

    // Tab değişimi
    document.querySelectorAll('.tx-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.txType = tab.dataset.type;
        document.querySelectorAll('.tx-tab').forEach(t => {
          t.classList.remove('bg-brand', 'text-white');
          t.classList.add('text-gray-400');
        });
        tab.classList.add('bg-brand', 'text-white');
        tab.classList.remove('text-gray-400');

        document.getElementById('tx-receiver-group').classList.toggle('hidden', this.txType !== 'transfer');
      });
    });

    // Form submit
    document.getElementById('form-tx').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        type: this.txType,
        payer_id: document.getElementById('tx-payer').value,
        amount: parseFloat(document.getElementById('tx-amount').value),
        description: document.getElementById('tx-desc').value,
        date: document.getElementById('tx-date').value
      };
      if (this.txType === 'transfer') {
        data.receiver_id = document.getElementById('tx-receiver').value;
        if (data.payer_id === data.receiver_id) {
          alert('Ödeyen ve alan aynı kişi olamaz!');
          return;
        }
      }

      try {
        await API.addTransaction(data);
        this.closeModal('modal-tx');
        document.getElementById('form-tx').reset();
        this.setDefaultDate();
        await this.refresh();
      } catch (err) {
        alert('Hata: ' + err.message);
      }
    });
  },

  // ─── Ortak Modal ───
  bindPartnerModal() {
    document.getElementById('btn-add-partner').addEventListener('click', () => {
      this.editingPartnerId = null;
      document.getElementById('partner-modal-title').textContent = 'Yeni Ortak';
      document.getElementById('form-partner').reset();
      document.getElementById('partner-color').value = this.getDefaultColor();
      document.getElementById('partner-color-label').textContent = this.getDefaultColor();
      this.openModal('modal-partner');
    });

    document.getElementById('modal-partner-close').addEventListener('click', () => this.closeModal('modal-partner'));
    document.getElementById('modal-partner').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.closeModal('modal-partner');
    });

    document.getElementById('partner-color').addEventListener('input', (e) => {
      document.getElementById('partner-color-label').textContent = e.target.value;
    });

    document.getElementById('form-partner').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById('partner-name').value.trim(),
        color: document.getElementById('partner-color').value
      };

      try {
        if (this.editingPartnerId) {
          await API.updatePartner(this.editingPartnerId, data);
        } else {
          await API.addPartner(data);
        }
        this.closeModal('modal-partner');
        await this.refresh();
        this.renderPartnerList();
      } catch (err) {
        alert('Hata: ' + err.message);
      }
    });
  },

  // ─── Ortak Listesi ───
  async renderPartnerList() {
    const list = document.getElementById('partner-list');
    const empty = document.getElementById('partner-empty');

    try {
      const partners = await API.getPartners();
      if (partners.length === 0) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
        return;
      }
      empty.classList.add('hidden');

      list.innerHTML = partners.map(p => `
        <div class="bg-surface rounded-xl p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full" style="background: ${p.color}"></div>
            <div>
              <p class="font-semibold">${this.esc(p.name)}</p>
              <p class="text-xs text-gray-400">${p.color}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="App.editPartner('${p.id}')" class="p-2 rounded-lg hover:bg-surface-light/50 text-gray-400 hover:text-white transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button onclick="App.removePartner('${p.id}')" class="p-2 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error(err);
    }
  },

  async editPartner(id) {
    const partner = this.partners.find(p => p.id === id);
    if (!partner) return;
    this.editingPartnerId = id;
    document.getElementById('partner-modal-title').textContent = 'Ortağı Düzenle';
    document.getElementById('partner-name').value = partner.name;
    document.getElementById('partner-color').value = partner.color;
    document.getElementById('partner-color-label').textContent = partner.color;
    this.openModal('modal-partner');
  },

  async removePartner(id) {
    const partner = this.partners.find(p => p.id === id);
    if (!partner) return;
    if (!confirm(`"${partner.name}" ortağını silmek istediğinize emin misiniz?`)) return;

    try {
      await API.deletePartner(id);
      await this.refresh();
      this.renderPartnerList();
    } catch (err) {
      alert('Hata: ' + err.message);
    }
  },

  // ─── İşlem Listesi ───
  async renderTransactionList() {
    const list = document.getElementById('tx-list');
    const empty = document.getElementById('tx-empty');

    try {
      const transactions = await API.getTransactions();
      if (transactions.length === 0) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
        return;
      }
      empty.classList.add('hidden');

      const partnerMap = {};
      this.partners.forEach(p => { partnerMap[p.id] = p; });

      list.innerHTML = transactions.slice().reverse().map(t => {
        const payer = partnerMap[t.payer_id] || { name: '?', color: '#666' };
        const isTransfer = t.type === 'transfer';
        const receiver = isTransfer ? (partnerMap[t.receiver_id] || { name: '?', color: '#666' }) : null;

        return `
          <div class="bg-surface rounded-xl p-4">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" style="background: ${payer.color}"></div>
                <span class="font-medium text-sm">${this.esc(payer.name)}</span>
                ${isTransfer ? `
                  <svg class="w-4 h-4 text-brand-light" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  <div class="w-3 h-3 rounded-full" style="background: ${receiver.color}"></div>
                  <span class="font-medium text-sm">${this.esc(receiver.name)}</span>
                ` : ''}
              </div>
              <span class="font-bold">${Ring.formatMoney(t.amount)} ₺</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xs px-2 py-0.5 rounded-full ${isTransfer ? 'bg-brand/20 text-brand-light' : 'bg-emerald-900/30 text-emerald-400'}">${isTransfer ? 'Transfer' : 'Harcama'}</span>
                ${t.description ? `<span class="text-xs text-gray-400">${this.esc(t.description)}</span>` : ''}
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500">${t.date}</span>
                <button onclick="App.removeTx(${t.id})" class="p-1 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition">
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

  async removeTx(id) {
    if (!confirm('Bu işlemi silmek istediğinize emin misiniz?')) return;
    try {
      await API.deleteTransaction(id);
      await this.refresh();
      this.renderTransactionList();
    } catch (err) {
      alert('Hata: ' + err.message);
    }
  },

  // ─── Tema ───
  bindTheme() {
    const html = document.documentElement;
    const stored = localStorage.getItem('amort-theme') || 'dark';
    if (stored === 'light') html.classList.remove('dark');

    document.getElementById('btn-theme').addEventListener('click', () => this.toggleTheme());
    document.getElementById('toggle-dark').addEventListener('click', () => this.toggleTheme());
  },

  toggleTheme() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    const isDark = html.classList.contains('dark');
    localStorage.setItem('amort-theme', isDark ? 'dark' : 'light');

    // Ring hole rengini güncelle
    const hole = document.querySelector('.ring-hole');
    const slash = document.querySelector('.ring-slash');
    if (isDark) {
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
  openModal(id) {
    document.getElementById(id).classList.add('open');
  },

  closeModal(id) {
    document.getElementById(id).classList.remove('open');
  },

  setDefaultDate() {
    document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
  },

  getDefaultColor() {
    const defaults = ['#FDE047', '#1E3A8A', '#10B981', '#F97316', '#EC4899', '#8B5CF6', '#06B6D4'];
    return defaults[this.partners.length % defaults.length];
  },

  esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

// Başlat
document.addEventListener('DOMContentLoaded', () => App.init());
