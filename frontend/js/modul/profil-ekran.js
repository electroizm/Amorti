import { API } from '../api.js';
import { ikonlariGuncelle } from '../ikonlar.js';

function basHarf(str) {
  return (str || '?').charAt(0).toUpperCase();
}

export function profilEkranKur(app) {
  // ─── Avatar render yardımcısı ───
  app.avatarIcerik = function (kullanici, buyukluk = 'normal') {
    const k = kullanici || API.getKullanici();
    if (k?.avatar_url) {
      return `<img src="${k.avatar_url}?t=${Date.now()}" class="w-full h-full object-cover" alt="Avatar">`;
    }
    const fontSize = buyukluk === 'kucuk' ? 'text-sm' : buyukluk === 'buyuk' ? 'text-3xl' : 'text-base';
    return `<div class="w-full h-full flex items-center justify-center bg-brand text-white font-bold ${fontSize}">${basHarf(k?.isim)}</div>`;
  };

  // Header avatar & profil menü avatar güncelle
  app.headerAvatarGuncelle = function () {
    const k = API.getKullanici();

    // Header buton
    const hAvatar = document.getElementById('btn-profil-avatar');
    if (hAvatar) hAvatar.innerHTML = app.avatarIcerik(k, 'kucuk');

    // Profil menü üst bölüm
    const mAvatar = document.getElementById('profil-menu-avatar');
    const mIsim = document.getElementById('profil-menu-isim');
    const mEposta = document.getElementById('profil-menu-eposta');
    if (mAvatar) mAvatar.innerHTML = app.avatarIcerik(k, 'kucuk');
    if (mIsim) mIsim.textContent = k?.isim || '';
    if (mEposta) mEposta.textContent = k?.eposta || '';

    // Profil ekranı avatar
    const pCerceve = document.getElementById('profil-avatar-cerceve');
    if (pCerceve) pCerceve.innerHTML = app.avatarIcerik(k, 'buyuk');

    ikonlariGuncelle();
  };

  // ─── Profil ekranını aç ───
  app.profilEkranGoster = function () {
    const k = API.getKullanici();
    if (k) {
      document.getElementById('profil-isim-input').value = k.isim || '';
      document.getElementById('profil-eposta-input').value = k.eposta || '';
      document.getElementById('profil-sifre-yeni').value = '';
      document.getElementById('profil-sifre-tekrar').value = '';
    }
    app.headerAvatarGuncelle();
    app.ekranGoster('profil');
  };

  // ─── Geri butonu ───
  document.getElementById('btn-profil-geri').addEventListener('click', () => {
    app.ekranGoster('app');
  });

  // ─── Avatar tıklama → dosya seç ───
  document.getElementById('profil-avatar-wrap').addEventListener('click', () => {
    document.getElementById('profil-foto-input').click();
  });

  // ─── Dosya seçildi → yükle ───
  document.getElementById('profil-foto-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    try {
      app.toast('Yükleniyor...', 'bilgi');
      const sonuc = await API.uploadAvatar(file);
      const k = API.getKullanici();
      API.setKullanici({ ...k, avatar_url: sonuc.avatar_url });
      app.headerAvatarGuncelle();
      app.toast('Fotoğraf güncellendi', 'basari');
    } catch (err) {
      app.toast(err.message, 'hata');
    }
  });

  // ─── İsim güncelle ───
  document.getElementById('btn-profil-isim-kaydet').addEventListener('click', async () => {
    const isim = document.getElementById('profil-isim-input').value.trim();
    if (!isim) return app.toast('İsim boş olamaz', 'hata');
    const btn = document.getElementById('btn-profil-isim-kaydet');
    btn.disabled = true;
    try {
      await API.profilGuncelle(isim);
      const k = API.getKullanici();
      API.setKullanici({ ...k, isim });
      app.headerAvatarGuncelle();
      app.toast('İsim güncellendi', 'basari');
    } catch (err) {
      app.toast(err.message, 'hata');
    } finally {
      btn.disabled = false;
    }
  });

  // ─── E-posta güncelle ───
  document.getElementById('btn-profil-eposta-kaydet').addEventListener('click', async () => {
    const eposta = document.getElementById('profil-eposta-input').value.trim();
    if (!eposta || !eposta.includes('@')) return app.toast('Geçerli bir e-posta girin', 'hata');
    const btn = document.getElementById('btn-profil-eposta-kaydet');
    btn.disabled = true;
    try {
      await API.epostaDegistir(eposta);
      const k = API.getKullanici();
      API.setKullanici({ ...k, eposta });
      app.headerAvatarGuncelle();
      app.toast('E-posta güncellendi. Doğrulama bağlantısı gönderildi.', 'basari');
    } catch (err) {
      app.toast(err.message, 'hata');
    } finally {
      btn.disabled = false;
    }
  });

  // ─── Şifre değiştir ───
  document.getElementById('btn-profil-sifre-kaydet').addEventListener('click', async () => {
    const yeni = document.getElementById('profil-sifre-yeni').value;
    const tekrar = document.getElementById('profil-sifre-tekrar').value;
    if (!yeni || yeni.length < 6) return app.toast('Şifre en az 6 karakter olmalıdır', 'hata');
    if (yeni !== tekrar) return app.toast('Şifreler eşleşmiyor', 'hata');
    const btn = document.getElementById('btn-profil-sifre-kaydet');
    btn.disabled = true;
    try {
      await API.sifreDegistir(yeni);
      document.getElementById('profil-sifre-yeni').value = '';
      document.getElementById('profil-sifre-tekrar').value = '';
      app.toast('Şifre değiştirildi', 'basari');
    } catch (err) {
      app.toast(err.message, 'hata');
    } finally {
      btn.disabled = false;
    }
  });
}
