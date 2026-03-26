/**
 * AMØRT! Auth Ekranı Modülü
 * Giriş ve kayıt form mantığı
 */
Object.assign(App, {
  bindAuth() {
    const tabGiris = document.getElementById('auth-tab-giris');
    const tabKayit = document.getElementById('auth-tab-kayit');
    const formGiris = document.getElementById('form-giris');
    const formKayit = document.getElementById('form-kayit');

    tabGiris.addEventListener('click', () => {
      tabGiris.classList.add('bg-brand', 'text-white');
      tabGiris.classList.remove('text-gray-500');
      tabKayit.classList.remove('bg-brand', 'text-white');
      tabKayit.classList.add('text-gray-500');
      formGiris.classList.remove('hidden');
      formKayit.classList.add('hidden');
    });

    tabKayit.addEventListener('click', () => {
      tabKayit.classList.add('bg-brand', 'text-white');
      tabKayit.classList.remove('text-gray-500');
      tabGiris.classList.remove('bg-brand', 'text-white');
      tabGiris.classList.add('text-gray-500');
      formKayit.classList.remove('hidden');
      formGiris.classList.add('hidden');
    });

    formGiris.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = formGiris.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        await API.giris(
          document.getElementById('giris-eposta').value,
          document.getElementById('giris-sifre').value
        );
        App.toast(t('auth.girisBasarili'), 'basari');
        App.ekranGoster('sirket');
        App.bindSirketSecici();
      } catch (err) {
        App.toast(err.message, 'hata');
        App.titresim(100);
      } finally {
        btn.disabled = false;
      }
    });

    formKayit.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = formKayit.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        const sonuc = await API.kayit(
          document.getElementById('kayit-isim').value,
          document.getElementById('kayit-eposta').value,
          document.getElementById('kayit-sifre').value
        );
        if (sonuc.dogrulama_gerekli) {
          App.toast(sonuc.mesaj, 'bilgi');
          tabGiris.click();
          return;
        }
        App.toast(t('auth.hesapOlusturuldu'), 'basari');
        App.ekranGoster('sirket');
        App.bindSirketSecici();
      } catch (err) {
        App.toast(err.message, 'hata');
        App.titresim(100);
      } finally {
        btn.disabled = false;
      }
    });
  }
});
