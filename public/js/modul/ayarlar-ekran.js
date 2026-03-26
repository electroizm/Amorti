/**
 * AMØRT! Ayarlar Ekranı Modülü
 * Metin ayarları (harf_bicimi, tr_temizle)
 */
Object.assign(App, {
  bindAyarlar() {
    const harfSelect = document.getElementById('ayar-harf-bicimi');
    const trCheckbox = document.getElementById('ayar-tr-temizle');

    harfSelect.addEventListener('change', async () => {
      try {
        await API.ayarlarGuncelle({ harf_bicimi: harfSelect.value });
        App.toast(t('ayarlar.ayarKaydedildi'), 'basari');
      } catch (err) { App.toast(err.message, 'hata'); }
    });

    trCheckbox.addEventListener('change', async () => {
      try {
        await API.ayarlarGuncelle({ tr_temizle: trCheckbox.checked });
        App.toast(t('ayarlar.ayarKaydedildi'), 'basari');
      } catch (err) { App.toast(err.message, 'hata'); }
    });
  },

  async ayarlariYukle() {
    try {
      const ayar = await API.getAyarlar();
      document.getElementById('ayar-harf-bicimi').value = ayar.harf_bicimi || 'oldugu_gibi';
      document.getElementById('ayar-tr-temizle').checked = !!ayar.tr_temizle;
    } catch (err) { console.error('Ayarlar yuklenemedi:', err); }

    // Gizli kişisel kasa kontrolü
    this.kisiselKasaAyarGuncelle();
  },

  async kisiselKasaAyarGuncelle() {
    const section = document.getElementById('kisisel-kasa-ayar');
    if (!section) return;
    try {
      const hepsi = await API.getSirketlerHepsi();
      const kullaniciId = API.getKullanici()?.id;
      const gizliKasa = hepsi.find(s => s.tip === 'bireysel' && s.gizli);
      if (gizliKasa) {
        section.classList.remove('hidden');
        const btn = document.getElementById('btn-kisisel-kasa-ac');
        // Listener sadece 1 kez
        if (!btn._bound) {
          btn._bound = true;
          btn.addEventListener('click', async () => {
            try {
              await API.sirketGoster(gizliKasa.id);
              App.toast(t('sirket.gosterildi'), 'basari');
              section.classList.add('hidden');
            } catch (err) { App.toast(err.message, 'hata'); }
          });
        }
      } else {
        section.classList.add('hidden');
      }
    } catch (err) { console.error('Kisisel kasa kontrol hatasi:', err); }
  }
});
