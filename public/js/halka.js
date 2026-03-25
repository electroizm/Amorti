/**
 * Ø Halkası (Donut Chart) Bileşeni
 * CSS conic-gradient ile animasyonlu donut chart
 */
const Ring = {
  el: null,
  toplamEl: null,

  init() {
    this.el = document.getElementById('ring-donut');
    this.toplamEl = document.getElementById('ring-total');
  },

  /**
   * Halkayı güncelle
   * @param {Array} ortaklar - [{id, isim, renk}]
   * @param {Object} harcamalar - {ortakId: toplamTutar}
   * @param {number} toplamHarcama
   */
  update(ortaklar, harcamalar, toplamHarcama) {
    if (!this.el) this.init();

    this.toplamEl.textContent = this.formatPara(toplamHarcama) + ' ₺';

    if (ortaklar.length === 0 || toplamHarcama === 0) {
      this.el.style.background = 'conic-gradient(#334155 0% 100%)';
      return;
    }

    const segments = [];
    let cumulative = 0;

    ortaklar.forEach(ortak => {
      const tutar = harcamalar[ortak.id] || 0;
      const yuzde = (tutar / toplamHarcama) * 100;
      const baslangic = cumulative;
      cumulative += yuzde;
      segments.push(`${ortak.renk} ${baslangic}% ${cumulative}%`);
    });

    if (cumulative < 99.9) {
      segments.push(`#334155 ${cumulative}% 100%`);
    }

    this.el.style.background = `conic-gradient(${segments.join(', ')})`;
  },

  formatPara(n) {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(n);
  }
};
