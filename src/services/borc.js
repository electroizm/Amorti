/**
 * Borc Sadelestirme (Debt Simplification) Servisi
 * Greedy algoritma ile minimum transfer sayisi hesaplar.
 * kasa_mi=true olan harcamalar borc hesabina dahil edilmez.
 */

function bakiyeleriHesapla(uyeler, islemler) {
  const bakiyeler = {};
  uyeler.forEach(u => { bakiyeler[u.id] = 0; });

  // Kasa islemlerini filtrele — borc hesabina dahil etme
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

function borclariSadelestir(uyeler, islemler) {
  const bakiyeler = bakiyeleriHesapla(uyeler, islemler);

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
