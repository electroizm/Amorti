/**
 * Metin Formatlama Servisi
 * Harf bicimi + TR karakter temizleme
 */

const TR_MAP = {
  'ş': 's', 'Ş': 'S',
  'ı': 'i', 'İ': 'I',
  'ö': 'o', 'Ö': 'O',
  'ü': 'u', 'Ü': 'U',
  'ç': 'c', 'Ç': 'C',
  'ğ': 'g', 'Ğ': 'G'
};

/**
 * Metin formatla
 * @param {string} metin
 * @param {Object} ayarlar - { harf_bicimi, tr_temizle }
 */
function formatla(metin, ayarlar = {}) {
  if (!metin) return metin;

  let sonuc = metin;

  // TR karakter temizleme
  if (ayarlar.tr_temizle) {
    sonuc = sonuc.replace(/[şŞıİöÖüÜçÇğĞ]/g, c => TR_MAP[c] || c);
  }

  // Harf bicimi
  switch (ayarlar.harf_bicimi) {
    case 'buyuk':
      sonuc = sonuc.toLocaleUpperCase('tr');
      break;
    case 'kucuk':
      sonuc = sonuc.toLocaleLowerCase('tr');
      break;
    // 'oldugu_gibi' veya undefined: degisiklik yok
  }

  return sonuc;
}

module.exports = { formatla };
