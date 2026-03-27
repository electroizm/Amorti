import { t } from '../dil/i18n.js';
import { API } from '../api.js';
import { ikonlariGuncelle } from '../ikonlar.js';

export function authEkranKur(app) {
  app.bindAuth = function () {
    const formGiris = document.getElementById('form-giris');
    const formKayit = document.getElementById('form-kayit');
    const dogrulamaMesaji = document.getElementById('auth-dogrulama-mesaji');

    document.getElementById('auth-kayit-goster').addEventListener('click', (e) => {
      e.preventDefault();
      formGiris.classList.add('hidden');
      formKayit.classList.remove('hidden');
      if (dogrulamaMesaji) dogrulamaMesaji.classList.add('hidden');
    });

    document.getElementById('auth-giris-goster').addEventListener('click', (e) => {
      e.preventDefault();
      formKayit.classList.add('hidden');
      formGiris.classList.remove('hidden');
      if (dogrulamaMesaji) dogrulamaMesaji.classList.add('hidden');
    });

    const dogrulamaGirisLink = document.getElementById('auth-dogrulama-giris');
    if (dogrulamaGirisLink) {
      dogrulamaGirisLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (dogrulamaMesaji) dogrulamaMesaji.classList.add('hidden');
        formGiris.classList.remove('hidden');
      });
    }

    document.querySelectorAll('.btn-sifre-goster').forEach(btn => {
      btn.addEventListener('click', () => {
        const wrapper = btn.closest('.sifre-wrapper');
        const input = wrapper.querySelector('input');
        const gizli = input.type === 'password';
        input.type = gizli ? 'text' : 'password';
        btn.innerHTML = gizli
          ? '<i data-lucide="eye-off" class="w-5 h-5"></i>'
          : '<i data-lucide="eye" class="w-5 h-5"></i>';
        ikonlariGuncelle();
      });
    });

    formGiris.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = formGiris.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        const hatirla = document.getElementById('beni-hatirla')?.checked;
        API.setDepolamaModu(hatirla ? 'local' : 'session');
        await API.giris(
          document.getElementById('giris-eposta').value,
          document.getElementById('giris-sifre').value
        );
        app.toast(t('auth.girisBasarili'), 'basari');
        app.ekranGoster('sirket');
        app.bindSirketSecici();
      } catch (err) {
        app.toast(err.message, 'hata');
        app.titresim(100);
      } finally { btn.disabled = false; }
    });

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
        app.toast(t('auth.hesapOlusturuldu'), 'basari');
        app.ekranGoster('sirket');
        app.bindSirketSecici();
      } catch (err) {
        app.toast(err.message, 'hata');
        app.titresim(100);
      } finally { btn.disabled = false; }
    });

    const googleOAuth = async () => {
      try {
        const config = await fetch('/api/config').then(r => r.json());
        if (!config.supabaseUrl || !config.supabaseKey) {
          app.toast('Google OAuth henüz yapılandırılmadı', 'hata');
          return;
        }
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(config.supabaseUrl, config.supabaseKey);
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin }
        });
      } catch (err) { app.toast(err.message, 'hata'); }
    };

    const btnGoogleGiris = document.getElementById('btn-google-giris');
    const btnGoogleKayit = document.getElementById('btn-google-kayit');
    if (btnGoogleGiris) btnGoogleGiris.addEventListener('click', googleOAuth);
    if (btnGoogleKayit) btnGoogleKayit.addEventListener('click', googleOAuth);

    app.handleOAuthRedirect();
  };

  app.handleOAuthRedirect = async function () {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) return;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken) return;
    history.replaceState(null, '', window.location.pathname);
    const hatirla = document.getElementById('beni-hatirla')?.checked;
    API.setDepolamaModu(hatirla !== false ? 'local' : 'session');
    API.setOturum({ access_token: accessToken, refresh_token: refreshToken });
    try {
      const kullanici = await API.request('/auth/ben');
      API.setKullanici(kullanici);
      app.toast(t('auth.girisBasarili'), 'basari');
      app.ekranGoster('sirket');
      app.bindSirketSecici();
    } catch (err) {
      API.temizleOturum();
      app.toast(err.message, 'hata');
    }
  };
}
