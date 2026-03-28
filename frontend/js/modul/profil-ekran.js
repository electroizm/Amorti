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

  // ─── Kasalar listesi ───
  app.profilKasalariGoster = function () {
    const sirketler = app.tumSirketler || [];
    const bolum = document.getElementById('profil-kasalar-bolum');
    const liste = document.getElementById('profil-kasa-listesi');
    if (!bolum || !liste) return;

    // Sadece 2+ kasada göster
    if (sirketler.length < 2) { bolum.classList.add('hidden'); return; }
    bolum.classList.remove('hidden');

    const aktifId = API.getSirketId();
    liste.innerHTML = sirketler.map(s => `
      <button class="profil-kasa-item w-full bg-white rounded-xl px-4 py-3 shadow-sm border flex items-center gap-3 transition
        ${s.id === aktifId ? 'border-brand/40 bg-brand/5' : 'border-gray-100 hover:border-brand/20'}"
        data-id="${s.id}">
        <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
          style="background:${s.id === aktifId ? '#6366f1' : '#94a3b8'}">
          ${(s.isim || '?').charAt(0).toUpperCase()}
        </div>
        <div class="flex-1 text-left min-w-0">
          <p class="font-semibold text-sm text-gray-900 truncate">${app.esc(s.isim)}</p>
          <p class="text-xs ${s.id === aktifId ? 'text-brand' : 'text-gray-400'}">${app.rolGoster(s.rol)}</p>
        </div>
        ${s.id === aktifId ? '<i data-lucide="check" class="w-4 h-4 text-brand flex-shrink-0"></i>' : '<i data-lucide="chevron-right" class="w-4 h-4 text-gray-300 flex-shrink-0"></i>'}
      </button>
    `).join('');
    ikonlariGuncelle();
  };

  // ─── Bekleyen davetler ───
  app.profilDavetleriGoster = async function () {
    const bolum = document.getElementById('profil-davetler-bolum');
    const liste = document.getElementById('profil-davet-listesi');
    if (!bolum || !liste) return;
    try {
      const davetler = await API.bekleyenDavetler();
      if (!davetler.length) { bolum.classList.add('hidden'); return; }
      bolum.classList.remove('hidden');
      liste.innerHTML = davetler.map(d => `
        <div class="bg-white rounded-xl p-4 shadow-sm border border-brand/20 flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="font-semibold text-sm text-gray-900 truncate">${app.esc(d.sirketler?.isim || '?')}</p>
            <p class="text-xs text-gray-400">${app.rolGoster(d.rol)}</p>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <button class="profil-davet-kabul px-3 py-1.5 bg-brand text-white text-xs rounded-lg font-semibold" data-id="${d.id}">Kabul</button>
            <button class="profil-davet-red px-3 py-1.5 bg-gray-100 text-gray-500 text-xs rounded-lg font-semibold" data-id="${d.id}">Reddet</button>
          </div>
        </div>
      `).join('');
    } catch {
      bolum.classList.add('hidden');
    }
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
    app.profilKasalariGoster();
    app.profilDavetleriGoster();
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

  // ─── Kasa listesi: kasa tıklama ───
  document.getElementById('profil-kasa-listesi').addEventListener('click', async (e) => {
    const btn = e.target.closest('.profil-kasa-item');
    if (!btn) return;
    const id = btn.dataset.id;
    if (id === API.getSirketId()) { app.ekranGoster('app'); return; }
    API.setSirketId(id);
    app.ekranGoster('app');
    await app.yenile();
  });

  // ─── Davet kabul / red ───
  document.getElementById('profil-davet-listesi').addEventListener('click', async (e) => {
    const kabulBtn = e.target.closest('.profil-davet-kabul');
    const redBtn = e.target.closest('.profil-davet-red');
    if (kabulBtn) {
      try {
        const sonuc = await API.davetKabul(kabulBtn.dataset.id);
        app.toast('Davet kabul edildi', 'basari');
        if (sonuc?.sirket_id) {
          API.setSirketId(sonuc.sirket_id);
          await app.yenile();
          app.ekranGoster('app');
        } else {
          app.profilDavetleriGoster();
        }
      } catch (err) { app.toast(err.message, 'hata'); }
    } else if (redBtn) {
      try {
        await API.davetRed(redBtn.dataset.id);
        app.toast('Davet reddedildi', 'bilgi');
        app.profilDavetleriGoster();
      } catch (err) { app.toast(err.message, 'hata'); }
    }
  });

  // ─── Yeni kasa oluştur ───
  document.getElementById('profil-form-kasa').addEventListener('submit', async (e) => {
    e.preventDefault();
    const isim = document.getElementById('profil-kasa-isim').value.trim();
    if (!isim) return;
    const btn = e.target.querySelector('[type="submit"]');
    btn.disabled = true;
    try {
      const sirket = await API.sirketOlustur(isim);
      document.getElementById('profil-kasa-isim').value = '';
      API.setSirketId(sirket.id);
      app.toast(`"${isim}" oluşturuldu`, 'basari');
      await app.yenile();
      app.ekranGoster('app');
    } catch (err) {
      app.toast(err.message, 'hata');
    } finally {
      btn.disabled = false;
    }
  });
}
