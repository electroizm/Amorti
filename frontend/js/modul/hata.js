import { t } from '../dil/i18n.js';

const agHatalari = {
  'failed to fetch': 'hata.agHatasi',
  'network error': 'hata.agHatasi',
  'networkerror': 'hata.agHatasi',
  'fetch failed': 'hata.agHatasi',
  'load failed': 'hata.agHatasi',
  'the internet connection appears to be offline': 'hata.cevrimdisi',
  'the network connection was lost': 'hata.cevrimdisi',
  'net::err_internet_disconnected': 'hata.cevrimdisi',
  'net::err_network_changed': 'hata.agHatasi',
  'aborted': 'hata.istekIptal',
  'the user aborted a request': 'hata.istekIptal',
  'timeout': 'hata.zamanAsimi',
  'the operation timed out': 'hata.zamanAsimi'
};

export function hataCevir(mesaj) {
  if (!mesaj) return t('hata.genelHata');
  const kucuk = mesaj.toLowerCase();
  if (agHatalari[kucuk]) return t(agHatalari[kucuk]);
  for (const [anahtar, cevirAnahtar] of Object.entries(agHatalari)) {
    if (kucuk.includes(anahtar)) return t(cevirAnahtar);
  }
  return mesaj;
}
