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
  }
});
