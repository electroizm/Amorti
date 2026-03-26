/**
 * Borc Sadelestirme (Debt Simplification) Servisi
 * Greedy algoritma ile minimum transfer sayisi hesaplar.
 * kasa_mi=true olan harcamalar borc hesabina dahil edilmez.
 *
 * Ortaklar varsa: hesaplama ortaklar bazinda yapilir.
 * Ortaklar yoksa: mevcut uye bazli hesaplama (geriye uyumlu).
 */

function bakiyeleriHesapla(uyeler, islemler, ortaklar) {
  // Ortaklar varsa ortak bazlı hesapla
  if (ortaklar && ortaklar.length > 0) {
    return _ortakBazliBakiye(ortaklar, islemler);
  }
  return _uyeBazliBakiye(uyeler, islemler);
}

function _uyeBazliBakiye(uyeler, islemler) {
  const bakiyeler = {};
  uyeler.forEach(u => { bakiyeler[u.id] = 0; });

  const aktifler = islemler.filter(i => !i.silinmis && !i.kasa_mi && !i.alan_kasa_mi);
  const n = uyeler.length;
  if (n === 0) return bakiyeler;

  for (const i of aktifler) {
    if (i.tur === 'harcama') {
      const pay = parseFloat(i.tutar) / n;
      bakiyeler[i.odeyen_id] += parseFloat(i.tutar);
      uyeler.forEach(u => { bakiyeler[u.id] -= pay; });
    } else if (i.tur === 'transfer') {
      bakiyeler[i.odeyen_id] += parseFloat(i.tutar);
      bakiyeler[i.alan_id] -= parseFloat(i.tutar);
    }
  }

  for (const id of Object.keys(bakiyeler)) {
    bakiyeler[id] = Math.round(bakiyeler[id] * 100) / 100;
  }
  return bakiyeler;
}

function _ortakBazliBakiye(ortaklar, islemler) {
  const bakiyeler = {};
  ortaklar.forEach(o => { bakiyeler[o.id] = 0; });

  const aktifler = islemler.filter(i => !i.silinmis && !i.kasa_mi && !i.alan_kasa_mi);
  const n = ortaklar.length;
  if (n === 0) return bakiyeler;

  // Pay yüzdeleri: null ise eşit bölüşüm
  const paylar = {};
  const toplamPay = ortaklar.reduce((s, o) => s + (o.pay != null ? parseFloat(o.pay) : 0), 0);
  const hepsiNull = ortaklar.every(o => o.pay == null);

  ortaklar.forEach(o => {
    if (hepsiNull) {
      paylar[o.id] = 1 / n;
    } else {
      paylar[o.id] = (o.pay != null ? parseFloat(o.pay) : 0) / (toplamPay || 100);
    }
  });

  for (const i of aktifler) {
    const odeyenOrtakId = i.odeyen_ortak_id || i.odeyen_id;
    if (i.tur === 'harcama') {
      const tutar = parseFloat(i.tutar);
      // Ödeyene tam tutar ekle
      if (bakiyeler[odeyenOrtakId] !== undefined) {
        bakiyeler[odeyenOrtakId] += tutar;
      }
      // Her ortaktan payını düş
      ortaklar.forEach(o => {
        bakiyeler[o.id] -= tutar * paylar[o.id];
      });
    } else if (i.tur === 'transfer') {
      const alanOrtakId = i.alan_ortak_id || i.alan_id;
      if (bakiyeler[odeyenOrtakId] !== undefined) {
        bakiyeler[odeyenOrtakId] += parseFloat(i.tutar);
      }
      if (bakiyeler[alanOrtakId] !== undefined) {
        bakiyeler[alanOrtakId] -= parseFloat(i.tutar);
      }
    }
  }

  for (const id of Object.keys(bakiyeler)) {
    bakiyeler[id] = Math.round(bakiyeler[id] * 100) / 100;
  }
  return bakiyeler;
}

function borclariSadelestir(uyeler, islemler, ortaklar) {
  const bakiyeler = bakiyeleriHesapla(uyeler, islemler, ortaklar);

  const alacaklilar = [];
  const borclular = [];

  for (const [id, bakiye] of Object.entries(bakiyeler)) {
    if (bakiye > 0.01) {
      alacaklilar.push({ id, tutar: bakiye });
    } else if (bakiye < -0.01) {
      borclular.push({ id, tutar: Math.abs(bakiye) });
    }
  }

  alacaklilar.sort((a, b) => b.tutar - a.tutar);
  borclular.sort((a, b) => b.tutar - a.tutar);

  const transferler = [];
  let i = 0, j = 0;

  while (i < borclular.length && j < alacaklilar.length) {
    const tutar = Math.min(borclular[i].tutar, alacaklilar[j].tutar);
    transferler.push({
      kimden: borclular[i].id,
      kime: alacaklilar[j].id,
      tutar: Math.round(tutar * 100) / 100
    });

    borclular[i].tutar -= tutar;
    alacaklilar[j].tutar -= tutar;

    if (borclular[i].tutar < 0.01) i++;
    if (alacaklilar[j].tutar < 0.01) j++;
  }

  return { bakiyeler, transferler };
}

module.exports = { bakiyeleriHesapla, borclariSadelestir };
