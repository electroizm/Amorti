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
          ? '<i data-lucide="eye-off" class="w-5 h-5"></i>'
          : '<i data-lucide="eye" class="w-5 h-5"></i>';
        App.ikonlariGuncelle();
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
        await API.kayit(
          document.getElementById('kayit-isim').value,
          document.getElementById('kayit-eposta').value,
          document.getElementById('kayit-sifre').value
        );
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
