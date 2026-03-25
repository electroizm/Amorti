/**
 * Borç Sadeleştirme (Debt Simplification) Servisi
 * Greedy algoritma ile minimum transfer sayısı hesaplar.
 * Türkçe alan adları: tur, odeyen_id, alan_id, tutar
 */

function bakiyeleriHesapla(ortaklar, islemler) {
  const bakiyeler = {};
  ortaklar.forEach(o => { bakiyeler[o.id] = 0; });

  const aktifler = islemler.filter(i => !i.silinmis);
  const n = ortaklar.length;
  if (n === 0) return bakiyeler;

  for (const i of aktifler) {
    if (i.tur === 'harcama') {
      const pay = i.tutar / n;
      bakiyeler[i.odeyen_id] += i.tutar;
      ortaklar.forEach(o => { bakiyeler[o.id] -= pay; });
    } else if (i.tur === 'transfer') {
      bakiyeler[i.odeyen_id] += i.tutar;
      bakiyeler[i.alan_id] -= i.tutar;
    }
  }

  for (const id of Object.keys(bakiyeler)) {
    bakiyeler[id] = Math.round(bakiyeler[id] * 100) / 100;
  }

  return bakiyeler;
}

function borclariSadelestir(ortaklar, islemler) {
  const bakiyeler = bakiyeleriHesapla(ortaklar, islemler);

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
