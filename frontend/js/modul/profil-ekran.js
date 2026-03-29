import { API } from '../api.js';
import { ikonlariGuncelle } from '../ikonlar.js';
import { gorselKirpKur, gorselKirpAc } from './gorsel-kirp.js';

function basHarf(str) {
  return (str || '?').charAt(0).toUpperCase();
}

export function profilEkranKur(app) {
  // ─── Crop modalını kur (tek seferlik) ───
  gorselKirpKur();

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

    const hAvatar = document.getElementById('btn-profil-avatar');
    if (hAvatar) hAvatar.innerHTML = app.avatarIcerik(k, 'kucuk');

    const mAvatar = document.getElementById('profil-menu-avatar');
    const mIsim = document.getElementById('profil-menu-isim');
    const mEposta = document.getElementById('profil-menu-eposta');
    if (mAvatar) mAvatar.innerHTML = app.avatarIcerik(k, 'kucuk');
    if (mIsim) mIsim.textContent = k?.isim || '';
    if (mEposta) mEposta.textContent = k?.eposta || '';

    const pCerceve = document.getElementById('profil-avatar-cerceve');
    if (pCerceve) pCerceve.innerHTML = app.avatarIcerik(k, 'buyuk');

    ikonlariGuncelle();
  };

  // ─── Kasalar listesi ───
  app.profilKasalariGoster = function () {
    const kullaniciId = API.getKullanici()?.id;
    const sirketler = app.tumSirketler || [];
    const bolum = document.getElementById('profil-kasalar-bolum');
    const liste = document.getElementById('profil-kasa-listesi');
    if (!bolum || !liste) return;

    if (sirketler.length < 1) { bolum.classList.add('hidden'); return; }
    bolum.classList.remove('hidden');

    const aktifId = API.getSirketId();
    liste.innerHTML = sirketler.map(s => {
      // Sahip kontrolü: sahip_id eşleşirse kesin sahip, yoksa yönetici de düzenleyebilir
      const sahip = s.sahip_id === kullaniciId || (s.sahip_id == null && s.rol === 'yonetici') || s.rol === 'yonetici';
      const aktif = s.id === aktifId;
      return `
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <button class="profil-kasa-item flex-1 bg-white rounded-xl px-4 py-3 shadow-sm border flex items-center gap-3 transition
              ${aktif ? 'border-brand/40 bg-brand/5' : 'border-gray-100 hover:border-brand/20'}"
              data-id="${s.id}">
              <div class="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-sm font-bold"
                style="background:${aktif ? '#6366f1' : '#94a3b8'}">
                ${s.logo_url ? `<img src="${s.logo_url}" class="w-full h-full object-cover" alt="">` : basHarf(s.isim)}
              </div>
              <div class="flex-1 text-left min-w-0">
                <p class="font-semibold text-sm text-gray-900 truncate">${app.esc(s.isim)}</p>
                <p class="text-xs ${aktif ? 'text-brand' : 'text-gray-400'}">${app.rolGoster(s.rol)}</p>
              </div>
              ${aktif
                ? '<i data-lucide="check" class="w-4 h-4 text-brand flex-shrink-0"></i>'
                : '<i data-lucide="chevron-right" class="w-4 h-4 text-gray-300 flex-shrink-0"></i>'}
            </button>
            ${sahip ? `
              <button class="kasa-duzenle-btn flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand transition"
                data-kasa-id="${s.id}" title="Kasayı düzenle">
                <i data-lucide="settings-2" class="w-4 h-4"></i>
              </button>
            ` : ''}
          </div>
          ${sahip ? `<div id="kd-panel-${s.id}" class="hidden"></div>` : ''}
        </div>
      `;
    }).join('');
    ikonlariGuncelle();
  };

  // ─── Kasa düzenle paneli aç/kapat ───
  app.kasaDuzenleToggle = async function (kasaId) {
    const panel = document.getElementById(`kd-panel-${kasaId}`);
    if (!panel) return;

    if (!panel.classList.contains('hidden')) {
      panel.classList.add('hidden');
      panel.innerHTML = '';
      return;
    }

    // Diğer açık panelleri kapat
    document.querySelectorAll('[id^="kd-panel-"]').forEach(p => {
      if (p.id !== `kd-panel-${kasaId}`) { p.classList.add('hidden'); p.innerHTML = ''; }
    });

    // Bu kasaya geç
    API.setSirketId(kasaId);
    panel.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">Yükleniyor...</p>';
    panel.classList.remove('hidden');

    await app._kasaDuzenleYukle(kasaId);
  };

  app._kasaDuzenleYukle = async function (kasaId) {
    const panel = document.getElementById(`kd-panel-${kasaId}`);
    if (!panel) return;
    try {
      const [uyeler, ortaklar, davetler] = await Promise.all([
        API.getUyeler(),
        API.getOrtaklar(),
        API.davetListele()
      ]);
      const kasa = (app.tumSirketler || []).find(s => s.id === kasaId) || {};
      panel.innerHTML = app._kasaDuzenlePanelHTML(kasa, uyeler, ortaklar, davetler);
      app._kasaDuzenleEventleriKur(kasaId, uyeler, ortaklar);
      ikonlariGuncelle();
    } catch (err) {
      panel.innerHTML = `<p class="text-center text-red-500 text-sm py-2">${app.esc(err.message)}</p>`;
    }
  };

  // ─── Kasa düzenle panel HTML ───
  app._kasaDuzenlePanelHTML = function (kasa, uyeler, ortaklar, davetler) {
    const ortaklikMi = kasa.tip === 'ortaklik';
    const toplamPay = ortaklar.reduce((s, o) => s + (o.pay != null ? parseFloat(o.pay) : 0), 0);
    const payRenk = toplamPay > 100 ? 'text-red-500' : toplamPay === 100 ? 'text-green-600' : 'text-gray-400';

    return `
      <div class="bg-brand/5 border border-brand/15 rounded-xl p-4 space-y-5 mt-1">

        <!-- ① Kasa Bilgileri -->
        <div class="space-y-3">
          <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Kasa Bilgileri</p>

          <!-- İsim -->
          <div class="flex gap-2">
            <input id="kd-isim" type="text" class="input-field flex-1 text-sm" value="${app.esc(kasa.isim || '')}" placeholder="Kasa adı">
            <button id="kd-isim-kaydet" class="px-3 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-dark transition whitespace-nowrap">Güncelle</button>
          </div>

          <!-- Logo -->
          <div id="kd-logo-wrap" class="flex items-center gap-3 cursor-pointer group w-fit">
            <div id="kd-logo-cerceve" class="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center text-white text-lg font-bold ring-2 ring-white shadow-sm relative"
              style="background:#6366f1">
              ${kasa.logo_url
                ? `<img src="${kasa.logo_url}?t=${Date.now()}" class="w-full h-full object-cover" alt="">`
                : `<span>${basHarf(kasa.isim)}</span>`}
              <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition pointer-events-none">
                <i data-lucide="camera" class="w-4 h-4 text-white"></i>
              </div>
            </div>
            <p class="text-xs text-gray-400">Görsel yükle</p>
          </div>
          <input type="file" id="kd-logo-input" accept="image/*" class="hidden">

          <!-- Ortaklık Kasası toggle -->
          <label class="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm cursor-pointer select-none">
            <div>
              <p class="text-sm font-semibold text-gray-800">Ortaklık Kasası</p>
              <p class="text-xs text-gray-400">Pay yüzdesiyle ortak takibi yapılır</p>
            </div>
            <div class="relative inline-flex items-center">
              <input type="checkbox" id="kd-ortaklik-toggle" class="sr-only peer" ${ortaklikMi ? 'checked' : ''}>
              <div class="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
            </div>
          </label>
        </div>

        <!-- ② Üyeler -->
        <div>
          <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Üyeler (${uyeler.length})</p>
          <div class="space-y-2 mb-3">
            ${uyeler.map(u => `
              <div class="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-100">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style="background:${u.renk || '#94a3b8'}">${basHarf(u.isim)}</div>
                <span class="flex-1 text-sm text-gray-800 truncate min-w-0">${app.esc(u.isim)}</span>
                <select class="kd-uye-rol text-xs border border-gray-200 rounded-lg px-1.5 py-1 text-gray-600 bg-white flex-shrink-0"
                  data-uye-id="${u.id}">
                  <option value="yonetici" ${u.rol === 'yonetici' ? 'selected' : ''}>Yönetici</option>
                  <option value="uye" ${u.rol === 'uye' ? 'selected' : ''}>Üye</option>
                  <option value="izleyici" ${u.rol === 'izleyici' ? 'selected' : ''}>İzleyici</option>
                </select>
                <button class="kd-uye-cikar p-1 text-gray-300 hover:text-red-500 transition flex-shrink-0" data-uye-id="${u.id}">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            `).join('')}
          </div>
          ${davetler.length > 0 ? `
            <div class="space-y-1 mb-3">
              ${davetler.map(d => `
                <div class="flex items-center gap-2 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                  <i data-lucide="mail" class="w-3.5 h-3.5 text-yellow-500 flex-shrink-0"></i>
                  <span class="flex-1 text-xs text-gray-600 truncate">${app.esc(d.eposta)}</span>
                  <span class="text-xs text-gray-400 flex-shrink-0">${app.rolGoster(d.rol)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          <div class="flex gap-2 flex-wrap">
            <input id="kd-davet-eposta" type="email" class="input-field flex-1 min-w-0 text-sm" placeholder="Davet et: e-posta">
            <select id="kd-davet-rol" class="input-field text-sm flex-shrink-0" style="width:110px">
              <option value="uye">Üye</option>
              <option value="yonetici">Yönetici</option>
              <option value="izleyici">İzleyici</option>
            </select>
            <button id="kd-davet-gonder" class="px-3 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold whitespace-nowrap hover:bg-brand-dark transition">Davet Et</button>
          </div>
        </div>

        <!-- ③ Ortaklar — SADECE ortaklık kasasında göster -->
        <div id="kd-ortaklar-bolum" class="${ortaklikMi ? '' : 'hidden'}">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Ortaklar</p>
            <p class="text-xs font-semibold ${payRenk}">Toplam: %${Math.round(toplamPay * 10) / 10}</p>
          </div>
          ${ortaklar.length < 2 ? `<p class="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-2">Ortaklık kasası için en az 2 ortak gerekli.</p>` : ''}
          <div class="space-y-2 mb-3">
            ${ortaklar.map(o => `
              <div class="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-100">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style="background:${o.renk || '#94a3b8'}">${basHarf(o.isim)}</div>
                <input class="kd-ortak-isim flex-1 min-w-0 text-sm bg-transparent outline-none text-gray-800 font-medium border-b border-transparent focus:border-brand transition"
                  value="${app.esc(o.isim)}" data-ortak-id="${o.id}">
                <div class="flex items-center gap-0.5 flex-shrink-0">
                  <span class="text-xs text-gray-400">%</span>
                  <input class="kd-ortak-pay w-14 text-sm text-right border border-gray-200 rounded-lg px-1.5 py-1 bg-white focus:border-brand outline-none transition"
                    type="number" min="0" max="100" step="1"
                    value="${o.pay != null ? o.pay : ''}" placeholder="—" data-ortak-id="${o.id}">
                </div>
                <button class="kd-ortak-kaydet px-2 py-1 bg-brand/10 text-brand rounded-lg text-xs font-bold hover:bg-brand/20 transition flex-shrink-0"
                  data-ortak-id="${o.id}">✓</button>
                <button class="kd-ortak-sil p-1 text-gray-300 hover:text-red-500 transition flex-shrink-0" data-ortak-id="${o.id}">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            `).join('')}
          </div>
          <div class="flex gap-2">
            <input id="kd-ortak-isim-yeni" type="text" class="input-field flex-1 text-sm" placeholder="Ortak ismi">
            <div class="flex items-center gap-0.5 flex-shrink-0">
              <span class="text-xs text-gray-400">%</span>
              <input id="kd-ortak-pay-yeni" type="number" class="input-field w-16 text-sm" min="0" max="100" step="1" placeholder="Pay">
            </div>
            <button id="kd-ortak-ekle" class="px-3 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold whitespace-nowrap hover:bg-brand-dark transition">Ekle</button>
          </div>
        </div>

      </div>
    `;
  };

  // ─── Kasa düzenle event listeners ───
  app._kasaDuzenleEventleriKur = function (kasaId, uyeler, ortaklar) {
    const panel = document.getElementById(`kd-panel-${kasaId}`);
    if (!panel) return;

    // Kasa ismi kaydet
    panel.querySelector('#kd-isim-kaydet').addEventListener('click', async () => {
      const isim = panel.querySelector('#kd-isim').value.trim();
      if (!isim) return app.toast('Kasa ismi boş olamaz', 'hata');
      const btn = panel.querySelector('#kd-isim-kaydet');
      btn.disabled = true;
      try {
        await API.sirketGuncelle(kasaId, isim);
        const kasa = (app.tumSirketler || []).find(s => s.id === kasaId);
        if (kasa) kasa.isim = isim;
        app.toast('Kasa ismi güncellendi', 'basari');
        app.profilKasalariGoster();
        app.profilMenuGuncelle();
        await app._kasaDuzenleYukle(kasaId);
      } catch (err) { app.toast(err.message, 'hata'); } finally { btn.disabled = false; }
    });

    // Kasa logo upload
    panel.querySelector('#kd-logo-wrap').addEventListener('click', () => {
      panel.querySelector('#kd-logo-input').click();
    });
    panel.querySelector('#kd-logo-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      e.target.value = '';
      gorselKirpAc(file, false, async (kirpilmis) => {
        try {
          app.toast('Yükleniyor...', 'bilgi');
          const sonuc = await API.uploadKasaLogo(kasaId, kirpilmis);
          const kasa = (app.tumSirketler || []).find(s => s.id === kasaId);
          if (kasa) kasa.logo_url = sonuc.logo_url;
          const cerceve = panel.querySelector('#kd-logo-cerceve');
          if (cerceve) {
            cerceve.innerHTML = `<img src="${sonuc.logo_url}?t=${Date.now()}" class="w-full h-full object-cover" alt="">
              <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition pointer-events-none">
                <i data-lucide="camera" class="w-5 h-5 text-white"></i>
              </div>`;
            ikonlariGuncelle();
          }
          app.profilKasalariGoster();
          app.toast('Görsel güncellendi', 'basari');
        } catch (err) { app.toast(err.message, 'hata'); }
      });
    });

    // Üye rol değiştir
    panel.querySelectorAll('.kd-uye-rol').forEach(sel => {
      sel.addEventListener('change', async () => {
        const uyeId = sel.dataset.uyeId;
        const eskiRol = sel.dataset.eskiRol || uyeler.find(u => u.id === uyeId)?.rol;
        try {
          await API.uyeRolDegistir(uyeId, sel.value);
          app.toast('Rol güncellendi', 'basari');
        } catch (err) {
          app.toast(err.message, 'hata');
          if (eskiRol) sel.value = eskiRol;
        }
      });
    });

    // Üye çıkar
    panel.querySelectorAll('.kd-uye-cikar').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uyeId = btn.dataset.uyeId;
        const uye = uyeler.find(u => u.id === uyeId);
        if (!confirm(`"${uye?.isim}" kasadan çıkarılsın mı?`)) return;
        try {
          await API.uyeSil(uyeId);
          app.toast('Üye çıkarıldı', 'bilgi');
          btn.closest('.flex.items-center').remove();
        } catch (err) { app.toast(err.message, 'hata'); }
      });
    });

    // Davet gönder
    panel.querySelector('#kd-davet-gonder').addEventListener('click', async () => {
      const eposta = panel.querySelector('#kd-davet-eposta').value.trim();
      const rol = panel.querySelector('#kd-davet-rol').value;
      if (!eposta || !eposta.includes('@')) return app.toast('Geçerli bir e-posta girin', 'hata');
      const btn = panel.querySelector('#kd-davet-gonder');
      btn.disabled = true;
      try {
        await API.davetGonder(eposta, rol, null);
        panel.querySelector('#kd-davet-eposta').value = '';
        app.toast(`${eposta} adresine davet gönderildi`, 'basari');
        await app._kasaDuzenleYukle(kasaId);
      } catch (err) { app.toast(err.message, 'hata'); } finally { btn.disabled = false; }
    });

    // Ortaklık kasası toggle
    panel.querySelector('#kd-ortaklik-toggle').addEventListener('change', async (e) => {
      const yeniTip = e.target.checked ? 'ortaklik' : 'bireysel';
      const ortaklarBolum = panel.querySelector('#kd-ortaklar-bolum');
      try {
        await API.sirketGuncelle(kasaId, { tip: yeniTip });
        const kasa = (app.tumSirketler || []).find(s => s.id === kasaId);
        if (kasa) kasa.tip = yeniTip;
        if (ortaklarBolum) {
          if (yeniTip === 'ortaklik') ortaklarBolum.classList.remove('hidden');
          else ortaklarBolum.classList.add('hidden');
        }
        app.toast(yeniTip === 'ortaklik' ? 'Ortaklık kasasına çevrildi' : 'Bireysel kasaya çevrildi', 'basari');
      } catch (err) {
        app.toast(err.message, 'hata');
        e.target.checked = !e.target.checked; // geri al
      }
    });

    // Ortak kaydet (satır içi)
    panel.querySelectorAll('.kd-ortak-kaydet').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ortakId = btn.dataset.ortakId;
        const row = btn.closest('.flex.items-center');
        const isim = row.querySelector('.kd-ortak-isim').value.trim();
        const payVal = row.querySelector('.kd-ortak-pay').value;
        const pay = payVal !== '' ? parseFloat(payVal) : null;
        if (!isim) return app.toast('Ortak ismi boş olamaz', 'hata');
        btn.disabled = true;
        try {
          await API.ortakGuncelle(ortakId, { isim, pay });
          app.toast('Ortak güncellendi', 'basari');
          await app._kasaDuzenleYukle(kasaId);
        } catch (err) { app.toast(err.message, 'hata'); } finally { btn.disabled = false; }
      });
    });

    // Ortak sil
    panel.querySelectorAll('.kd-ortak-sil').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ortakId = btn.dataset.ortakId;
        const ortak = ortaklar.find(o => o.id === ortakId);
        if (!confirm(`"${ortak?.isim}" ortaklar listesinden çıkarılsın mı?`)) return;
        try {
          await API.ortakSil(ortakId);
          app.toast('Ortak çıkarıldı', 'bilgi');
          // Panel açık kalsın: önce arka planda yenile, sonra paneli yenile
          app.yenile().catch(() => {});
          await app._kasaDuzenleYukle(kasaId);
        } catch (err) { app.toast(err.message, 'hata'); }
      });
    });

    // Ortak ekle
    panel.querySelector('#kd-ortak-ekle').addEventListener('click', async () => {
      const isim = panel.querySelector('#kd-ortak-isim-yeni').value.trim();
      const payVal = panel.querySelector('#kd-ortak-pay-yeni').value;
      const pay = payVal !== '' ? parseFloat(payVal) : null;
      if (!isim) return app.toast('Ortak ismi gerekli', 'hata');
      const btn = panel.querySelector('#kd-ortak-ekle');
      btn.disabled = true;
      try {
        await API.ortakEkle({ isim, pay, renk: '#94a3b8' });
        panel.querySelector('#kd-ortak-isim-yeni').value = '';
        panel.querySelector('#kd-ortak-pay-yeni').value = '';
        app.toast(`"${isim}" ortak olarak eklendi`, 'basari');
        // Panel açık kalsın: önce arka planda yenile, sonra paneli yenile
        app.yenile().catch(() => {});
        await app._kasaDuzenleYukle(kasaId);
      } catch (err) { app.toast(err.message, 'hata'); } finally { btn.disabled = false; }
    });
  };

  // ─── Bekleyen davetler (profil sayfası üstü) ───
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

  // ─── Profil sayfasını aç ───
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
    app.navigate('profil');
  };

  // ─── Geri butonu ───
  document.getElementById('btn-profil-geri').addEventListener('click', () => {
    app.navigate('home');
  });

  // ─── Avatar tıklama → dosya seç ───
  document.getElementById('profil-avatar-wrap').addEventListener('click', () => {
    document.getElementById('profil-foto-input').click();
  });

  // ─── Dosya seçildi → crop → yükle ───
  document.getElementById('profil-foto-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    gorselKirpAc(file, true, async (kirpilmis) => {
      try {
        app.toast('Yükleniyor...', 'bilgi');
        const sonuc = await API.uploadAvatar(kirpilmis);
        const k = API.getKullanici();
        API.setKullanici({ ...k, avatar_url: sonuc.avatar_url });
        app.headerAvatarGuncelle();
        app.toast('Fotoğraf güncellendi', 'basari');
      } catch (err) {
        app.toast(err.message, 'hata');
      }
    });
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

  // ─── Kasa listesi: kasa tıklama (geçiş) ───
  document.getElementById('profil-kasa-listesi').addEventListener('click', async (e) => {
    // Düzenle butonu
    const duzenleBtn = e.target.closest('.kasa-duzenle-btn');
    if (duzenleBtn) {
      e.stopPropagation();
      await app.kasaDuzenleToggle(duzenleBtn.dataset.kasaId);
      return;
    }
    // Kasa seç
    const btn = e.target.closest('.profil-kasa-item');
    if (!btn) return;
    const id = btn.dataset.id;
    if (id === API.getSirketId()) { app.navigate('home'); return; }
    API.setSirketId(id);
    app.navigate('home');
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
          app.navigate('home');
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
      app.profilKasalariGoster();
    } catch (err) {
      app.toast(err.message, 'hata');
    } finally {
      btn.disabled = false;
    }
  });
}
