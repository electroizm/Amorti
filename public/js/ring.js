/**
 * Ø Halkası (Donut Chart) Bileşeni
 * CSS conic-gradient ile animasyonlu donut chart
 */
const Ring = {
  el: null,
  totalEl: null,

  init() {
    this.el = document.getElementById('ring-donut');
    this.totalEl = document.getElementById('ring-total');
  },

  /**
   * Halkayı güncelle
   * @param {Array} partners - [{id, name, color}]
   * @param {Object} spending - {partnerId: totalAmount}
   * @param {number} totalSpending - Toplam harcama
   */
  update(partners, spending, totalSpending) {
    if (!this.el) this.init();

    // Toplam tutar göster
    this.totalEl.textContent = this.formatMoney(totalSpending) + ' ₺';

    if (partners.length === 0 || totalSpending === 0) {
      this.el.style.background = 'conic-gradient(#334155 0% 100%)';
      return;
    }

    // Conic gradient segmentleri oluştur
    const segments = [];
    let cumulative = 0;

    partners.forEach(partner => {
      const amount = spending[partner.id] || 0;
      const pct = (amount / totalSpending) * 100;
      const start = cumulative;
      cumulative += pct;
      segments.push(`${partner.color} ${start}% ${cumulative}%`);
    });

    // Eğer hiç harcama olmayan ortaklar varsa, kalan kısmı gri yap
    if (cumulative < 99.9) {
      segments.push(`#334155 ${cumulative}% 100%`);
    }

    this.el.style.background = `conic-gradient(${segments.join(', ')})`;
  },

  formatMoney(n) {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(n);
  }
};
