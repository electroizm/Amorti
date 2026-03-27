/**
 * AMØRT! Ayarlar Ekranı Modülü (ES Module)
 */
import { t } from '../dil/i18n.js';
import { API } from '../api.js';

export function ayarlarEkranKur(app) {

  app.bindAyarlar = function () {
    const harfSelect = document.getElementById('ayar-harf-bicimi');
    const trCheckbox = document.getElementById('ayar-tr-temizle');

    harfSelect.addEventListener('change', async () => {
      try {
        await API.ayarlarGuncelle({ harf_bicimi: harfSelect.value });
        app.toast(t('ayarlar.ayarKaydedildi'), 'basari');
      } catch (err) { app.toast(err.message, 'hata'); }
    });

    trCheckbox.addEventListener('change', async () => {
      try {
        await API.ayarlarGuncelle({ tr_temizle: trCheckbox.checked });
        app.toast(t('ayarlar.ayarKaydedildi'), 'basari');
      } catch (err) { app.toast(err.message, 'hata'); }
    });
  };

  app.ayarlariYukle = async function () {
    try {
      const ayar = await API.getAyarlar();
      document.getElementById('ayar-harf-bicimi').value = ayar.harf_bicimi || 'oldugu_gibi';
      document.getElementById('ayar-tr-temizle').checked = !!ayar.tr_temizle;
    } catch (err) { console.error('Ayarlar yuklenemedi:', err); }

    app.kisiselKasaAyarGuncelle();
  };

  app.kisiselKasaAyarGuncelle = async function () {
    const section = document.getElementById('kisisel-kasa-ayar');
    if (!section) return;
    try {
      const hepsi = await API.getSirketlerHepsi();
      const gizliKasa = hepsi.find(s => s.tip === 'bireysel' && s.gizli);
      if (gizliKasa) {
        section.classList.remove('hidden');
        const btn = document.getElementById('btn-kisisel-kasa-ac');
        if (!btn._bound) {
          btn._bound = true;
          btn.addEventListener('click', async () => {
            try {
              await API.sirketGoster(gizliKasa.id);
              app.toast(t('sirket.gosterildi'), 'basari');
              section.classList.add('hidden');
            } catch (err) { app.toast(err.message, 'hata'); }
          });
        }
      } else {
        section.classList.add('hidden');
      }
    } catch (err) { console.error('Kisisel kasa kontrol hatasi:', err); }
  };
}
