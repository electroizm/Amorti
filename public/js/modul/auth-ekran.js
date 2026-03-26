/**
 * AMØRT! Auth Ekranı Modülü
 * Giriş, kayıt, şifre göster/gizle, Google OAuth, email doğrulama
 */
Object.assign(App, {
  bindAuth() {
    const formGiris = document.getElementById('form-giris');
    const formKayit = document.getElementById('form-kayit');
    const dogrulamaMesaji = document.getElementById('auth-dogrulama-mesaji');

    // --- Link-based geçiş ---
    document.getElementById('auth-kayit-goster').addEventListener('click', (e) => {
      e.preventDefault();
      formGiris.classList.add('hidden');
      formKayit.classList.remove('hidden');
      dogrulamaMesaji.classList.add('hidden');
    });

    document.getElementById('auth-giris-goster').addEventListener('click', (e) => {
      e.preventDefault();
      formKayit.classList.add('hidden');
      formGiris.classList.remove('hidden');
      dogrulamaMesaji.classList.add('hidden');
    });

    // Doğrulama mesajındaki giriş linki
    const dogrulamaGirisLink = document.getElementById('auth-dogrulama-giris');
    if (dogrulamaGirisLink) {
      dogrulamaGirisLink.addEventListener('click', (e) => {
        e.preventDefault();
        dogrulamaMesaji.classList.add('hidden');
        formGiris.classList.remove('hidden');
      });
    }

    // --- Şifre göster/gizle ---
    document.querySelectorAll('.btn-sifre-goster').forEach(btn => {
      btn.addEventListener('click', () => {
        const wrapper = btn.closest('.sifre-wrapper');
        const input = wrapper.querySelector('input');
        const gizli = input.type === 'password';
        input.type = gizli ? 'text' : 'password';
        // SVG swap: göz açık ↔ göz kapalı
        btn.innerHTML = gizli
          ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>'
          : '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
      });
    });

    // --- Giriş formu ---
    formGiris.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = formGiris.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        // Beni Hatırla
        const hatirla = document.getElementById('beni-hatirla')?.checked;
        API.setDepolamaModu(hatirla ? 'local' : 'session');

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

    // --- Kayıt formu ---
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
          // Doğrulama mesajını göster
          formKayit.classList.add('hidden');
          dogrulamaMesaji.classList.remove('hidden');
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

    // --- Google OAuth ---
    const btnGoogleGiris = document.getElementById('btn-google-giris');
    const btnGoogleKayit = document.getElementById('btn-google-kayit');

    const googleOAuth = async () => {
      try {
        const config = await fetch('/api/config').then(r => r.json());
        if (!config.supabaseUrl || !config.supabaseKey) {
          App.toast('Google OAuth henüz yapılandırılmadı', 'hata');
          return;
        }
        const supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin }
        });
      } catch (err) {
        App.toast(err.message, 'hata');
      }
    };

    if (btnGoogleGiris) btnGoogleGiris.addEventListener('click', googleOAuth);
    if (btnGoogleKayit) btnGoogleKayit.addEventListener('click', googleOAuth);

    // --- OAuth Redirect Handler ---
    this.handleOAuthRedirect();
  },

  async handleOAuthRedirect() {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) return;

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken) return;

    // URL'den hash'i temizle
    history.replaceState(null, '', window.location.pathname);

    // Oturumu kaydet
    const hatirla = document.getElementById('beni-hatirla')?.checked;
    API.setDepolamaModu(hatirla !== false ? 'local' : 'session');
    API.setOturum({ access_token: accessToken, refresh_token: refreshToken });

    // Kullanıcı bilgisini backend'den al
    try {
      const kullanici = await API.request('/auth/ben');
      API.setKullanici(kullanici);
      App.toast(t('auth.girisBasarili'), 'basari');
      App.ekranGoster('sirket');
      App.bindSirketSecici();
    } catch (err) {
      API.temizleOturum();
      App.toast(err.message, 'hata');
    }
  }
});
