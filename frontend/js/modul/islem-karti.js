import { t } from '../dil/i18n.js';
import { API } from '../api.js';
import { ikonlariGuncelle } from '../ikonlar.js';

function bas(isim) {
  return (isim || '?').charAt(0).toUpperCase();
}

function formatAmountInput(input) {
  const v = input.value;
  const clean = v.replace(/[^\d,]/g, '');
  const parts = clean.split(',');
  const intRaw = parts[0].replace(/\./g, '') || '';
  if (!intRaw) { input.value = v.endsWith(',') ? ',' : ''; return; }
  const intNum = parseInt(intRaw, 10);
  if (isNaN(intNum)) return;
  const thousands = new Intl.NumberFormat('tr-TR').format(intNum);
  if (parts.length > 1) {
    input.value = thousands + ',' + parts[1].slice(0, 2);
  } else {
    input.value = thousands + (v.endsWith(',') ? ',' : '');
  }
}

function parseAmount(str) {
  return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}

export function islemKartiKur(app) {
  app.bindFAB = function () {
    document.getElementById('fab').addEventListener('click', () => {
      if (app.rol === 'izleyici') return;
      if (app.uyeler.length < 1) {
        app.toast(t('islem.henuzUyeYok'), 'hata');
        app.titresim(100);
        return;
      }
      app.formTxTemizle();
      app.tablarGuncelle();
      app.modalAc('modal-tx');
    });
  };

  app.bindIslemModal = function () {
    document.getElementById('modal-tx-close').addEventListener('click', () => app.modalKapat('modal-tx'));
    document.getElementById('modal-tx').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) app.modalKapat('modal-tx');
    });

    // ─── Tutar otomatik biçimleme ───
    const amtInput = document.getElementById('tx-amount');
    amtInput.addEventListener('input', () => formatAmountInput(amtInput));
    amtInput.addEventListener('focus', () => amtInput.select());

    // ─── Transfer: payer değişince receiver otomatik farklı biri ───
    const payerSel = document.getElementById('tx-payer');
    const receiverSel = document.getElementById('tx-receiver');
    payerSel.addEventListener('change', () => {
      if (app.islemTuru !== 'transfer') return;
      if (receiverSel.value === payerSel.value) {
        const baska = Array.from(receiverSel.options).find(o => o.value !== payerSel.value);
        if (baska) receiverSel.value = baska.value;
      }
    });

    document.querySelectorAll('.tx-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        app.islemTuru = tab.dataset.type;
        document.querySelectorAll('.tx-tab').forEach(t => {
          t.classList.remove('bg-brand', 'text-white');
          t.classList.add('text-gray-400');
        });
        tab.classList.add('bg-brand', 'text-white');
        tab.classList.remove('text-gray-400');
        document.getElementById('tx-receiver-group').classList.toggle('hidden', app.islemTuru !== 'transfer');
        document.getElementById('tx-payer-group').classList.toggle('hidden', app.islemTuru === 'gelir');
      });
    });

    document.getElementById('form-tx').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (app.rol === 'izleyici') return;
      const submitBtn = e.target.querySelector('[type="submit"]');
      if (submitBtn.disabled) return;
      submitBtn.disabled = true;

      const tutar = parseAmount(amtInput.value);
      if (!tutar || tutar <= 0) {
        app.toast(t('islem.tutarHata'), 'hata');
        app.titresim(100);
        submitBtn.disabled = false;
        return;
      }

      const ortakModu = (app.ortaklar || []).length > 0;

      // Gelir işlemi: payer yok, sadece tutar + açıklama + tarih
      if (app.islemTuru === 'gelir') {
        const data = {
          tur: 'gelir',
          odeyen_id: app.uyeler[0]?.id,
          tutar,
          aciklama: document.getElementById('tx-desc').value,
          tarih: document.getElementById('tx-date').value,
          kasa_mi: false
        };
        try {
          const sonuc = await API.addIslem(data);
          app.titresim();
          app.modalKapat('modal-tx');
          app.formTxTemizle();
          if (sonuc.kuyrukta) { app.toast(t('cevrimdisi.kuyrugaEklendi'), 'bilgi'); }
          else { app.toast(t('islem.gelirEklendi'), 'basari'); }
          await app.yenile();
          if (app.mevcutSayfa === 'transactions') app.islemListesiGoster();
        } catch (err) {
          app.toast(t('hata.hataOneki', { mesaj: err.message }), 'hata');
          app.titresim(100);
        } finally {
          submitBtn.disabled = false;
        }
        return;
      }

      const payerVal = document.getElementById('tx-payer').value;
      const kasaMi = payerVal === '__kasa__';
      const data = {
        tur: app.islemTuru,
        odeyen_id: kasaMi ? app.uyeler[0]?.id : (ortakModu ? app.uyeler[0]?.id : payerVal),
        tutar,
        aciklama: document.getElementById('tx-desc').value,
        tarih: document.getElementById('tx-date').value,
        kasa_mi: kasaMi
      };
      if (ortakModu && !kasaMi) data.odeyen_ortak_id = payerVal;

      if (app.islemTuru === 'transfer') {
        const receiverVal = document.getElementById('tx-receiver').value;
        const alanKasaMi = receiverVal === '__kasa__';
        if (kasaMi && alanKasaMi) { app.toast(t('islem.kasaKasaHata'), 'hata'); app.titresim(100); submitBtn.disabled = false; return; }
        data.alan_id = alanKasaMi ? app.uyeler[0]?.id : (ortakModu ? app.uyeler[0]?.id : receiverVal);
        data.alan_kasa_mi = alanKasaMi;
        if (ortakModu && !alanKasaMi) data.alan_ortak_id = receiverVal;
        if (!kasaMi && !alanKasaMi && data.odeyen_id === data.alan_id) {
          app.toast(t('islem.ayniKisiHata'), 'hata'); app.titresim(100); submitBtn.disabled = false; return;
        }
      }

      try {
        const sonuc = await API.addIslem(data);
        app.titresim();
        app.modalKapat('modal-tx');
        app.formTxTemizle();
        if (sonuc.kuyrukta) { app.toast(t('cevrimdisi.kuyrugaEklendi'), 'bilgi'); }
        else { app.toast(kasaMi ? t('islem.kasaEklendi') : app.islemTuru === 'transfer' ? t('islem.transferKaydedildi') : t('islem.harcamaEklendi'), 'basari'); }
        await app.yenile();
        if (app.mevcutSayfa === 'transactions') app.islemListesiGoster();
      } catch (err) {
        app.toast(t('hata.hataOneki', { mesaj: err.message }), 'hata');
        app.titresim(100);
      } finally {
        submitBtn.disabled = false;
      }
    });

    // ─── İşlem Düzenleme Modalı ───
    document.getElementById('modal-islem-duzenle-close').addEventListener('click', () => app.modalKapat('modal-islem-duzenle'));
    document.getElementById('modal-islem-duzenle').addEventListener('click', (e) => { if (e.target === e.currentTarget) app.modalKapat('modal-islem-duzenle'); });

    const duzenleAmtInput = document.getElementById('islem-duzenle-tutar');
    duzenleAmtInput.addEventListener('input', () => formatAmountInput(duzenleAmtInput));
    duzenleAmtInput.addEventListener('focus', () => duzenleAmtInput.select());

    document.getElementById('form-islem-duzenle').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('islem-duzenle-id').value;
      const tutar = parseAmount(duzenleAmtInput.value);
      if (!tutar || tutar <= 0) { app.toast(t('islem.tutarHata'), 'hata'); return; }
      const btn = e.target.querySelector('[type="submit"]');
      btn.disabled = true;
      try {
        const ortakModu = (app.ortaklar || []).length > 0;
        const odeyenVal = document.getElementById('islem-duzenle-odeyen').value;
        const patchData = {
          tutar,
          aciklama: document.getElementById('islem-duzenle-aciklama').value,
          tarih: document.getElementById('islem-duzenle-tarih').value,
          odeyen_id: ortakModu ? app.uyeler[0]?.id : odeyenVal,
          ...(ortakModu ? { odeyen_ortak_id: odeyenVal } : {})
        };
        await API.updateIslem(parseInt(id), patchData);
        app.titresim(); app.toast(t('islem.guncellendi'), 'basari');
        app.modalKapat('modal-islem-duzenle');
        await app.yenile();
        app.islemListesiGoster();
      } catch (err) { app.toast(t('hata.hataOneki', { mesaj: err.message }), 'hata'); }
      finally { btn.disabled = false; }
    });
  };

  app.formTxTemizle = function () {
    document.getElementById('tx-amount').value = '';
    document.getElementById('tx-desc').value = '';
    app.varsayilanTarih();
    app.selectGuncelle();
    // Gider tabına sıfırla
    app.islemTuru = 'harcama';
    document.querySelectorAll('.tx-tab').forEach(tab => {
      const aktif = tab.dataset.type === 'harcama';
      tab.classList.toggle('bg-brand', aktif);
      tab.classList.toggle('text-white', aktif);
      tab.classList.toggle('text-gray-400', !aktif);
    });
    document.getElementById('tx-receiver-group').classList.add('hidden');
    document.getElementById('tx-payer-group').classList.remove('hidden');
  };

  app.tablarGuncelle = function () {
    // Gelir sekmesi her zaman görünür
    document.querySelector('.tx-tab[data-type="gelir"]')?.classList.remove('hidden');
  };

  app.selectGuncelle = function () {
    const kullanici = API.getKullanici();
    const kullaniciId = kullanici?.id;
    const ortaklar = app.ortaklar || [];
    const kasaOption = app.sirketIsim ? `<option value="__kasa__">🏢 ${app.esc(app.sirketIsim)}</option>` : '';

    const payerSel = document.getElementById('tx-payer');
    const receiverSel = document.getElementById('tx-receiver');

    if (ortaklar.length > 0) {
      const mevcutUye = app.uyeler.find(u => u.kullanici_id === kullaniciId);
      const varsayilanOrtakId = mevcutUye?.ortak_id;
      const odeyenOptions = ortaklar.map(o => `<option value="${o.id}" ${o.id === varsayilanOrtakId ? 'selected' : ''}>${app.esc(o.isim)}</option>`).join('');
      payerSel.innerHTML = kasaOption + (odeyenOptions || `<option value="">${t('islem.uyeYok')}</option>`);
      const alanOptions = ortaklar.map(o => `<option value="${o.id}">${app.esc(o.isim)}</option>`).join('');
      receiverSel.innerHTML = kasaOption + (alanOptions || `<option value="">${t('islem.uyeYok')}</option>`);
    } else {
      const odeyenOptions = app.uyeler.map(u => `<option value="${u.id}" ${u.kullanici_id === kullaniciId ? 'selected' : ''}>${app.esc(u.isim)}</option>`).join('');
      payerSel.innerHTML = kasaOption + (odeyenOptions || `<option value="">${t('islem.uyeYok')}</option>`);
      const alanOptions = app.uyeler.map(u => `<option value="${u.id}">${app.esc(u.isim)}</option>`).join('');
      receiverSel.innerHTML = kasaOption + (alanOptions || `<option value="">${t('islem.uyeYok')}</option>`);
    }

    // Receiver, payer ile aynıysa otomatik farklı biri seç
    if (receiverSel.value === payerSel.value) {
      const baska = Array.from(receiverSel.options).find(o => o.value !== payerSel.value);
      if (baska) receiverSel.value = baska.value;
    }

    app.tablarGuncelle();
  };

  app.islemListesiGoster = async function () {
    const list = document.getElementById('tx-list');
    const empty = document.getElementById('tx-empty');
    try {
      const islemler = await API.getIslemler();
      if (islemler.length === 0) { list.innerHTML = ''; empty.classList.remove('hidden'); return; }
      empty.classList.add('hidden');

      const uyeMap = {}; app.uyeler.forEach(u => { uyeMap[u.id] = u; });
      const ortakMap = {}; (app.ortaklar || []).forEach(o => { ortakMap[o.id] = o; });
      const izleyici = app.rol === 'izleyici';

      list.innerHTML = islemler.slice().reverse().map(i => {
        const odeyenOrtak = i.odeyen_ortak_id ? ortakMap[i.odeyen_ortak_id] : null;
        const odeyen = odeyenOrtak || uyeMap[i.odeyen_id] || { isim: '?', renk: '#94a3b8' };
        const transferMi = i.tur === 'transfer';
        const kasaMi = i.kasa_mi;
        const alanKasaMi = i.alan_kasa_mi;
        const alanOrtak = i.alan_ortak_id ? ortakMap[i.alan_ortak_id] : null;
        const alan = transferMi ? (alanOrtak || uyeMap[i.alan_id] || { isim: '?', renk: '#94a3b8' }) : null;

        const odeyenIsim = kasaMi ? app.sirketIsim : odeyen.isim;
        const odeyenRenk = kasaMi ? '#6366f1' : odeyen.renk;
        const alanIsim  = alanKasaMi ? app.sirketIsim : alan?.isim;
        const alanRenk  = alanKasaMi ? '#6366f1' : alan?.renk;

        let typePill;
        if (kasaMi || alanKasaMi) {
          typePill = `<span class="tx-pill tx-pill-kasa">🏢 ${app.esc(app.sirketIsim)}</span>`;
        } else if (transferMi) {
          typePill = `<span class="tx-pill tx-pill-transfer">${t('tur.transfer')}</span>`;
        } else if (i.tur === 'gelir') {
          typePill = `<span class="tx-pill tx-pill-gelir">${t('tur.gelir')}</span>`;
        } else {
          typePill = `<span class="tx-pill tx-pill-harcama">${t('tur.harcama')}</span>`;
        }

        const aciklama = i.aciklama
          ? `<span class="tx-aciklama">${app.esc(i.aciklama)}</span>`
          : '';

        const gelirMi = i.tur === 'gelir';
        const avatarLeft = kasaMi
          ? `<div class="amort-avatar" style="background:#6366f1"><i data-lucide="building-2" class="w-4 h-4"></i></div>`
          : gelirMi
            ? `<div class="amort-avatar" style="background:#10b981"><i data-lucide="trending-up" class="w-4 h-4"></i></div>`
            : `<div class="amort-avatar" style="background:${odeyenRenk}">${bas(odeyenIsim)}</div>`;

        const transferArrow = transferMi ? `
          <div class="tx-transfer-row">
            <div class="amort-avatar amort-avatar-sm" style="background:${odeyenRenk}">${kasaMi ? '🏢' : bas(odeyenIsim)}</div>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-brand/60 shrink-0"></i>
            <div class="amort-avatar amort-avatar-sm" style="background:${alanRenk}">${alanKasaMi ? '🏢' : bas(alanIsim)}</div>
            <span class="tx-transfer-names">${app.esc(odeyenIsim)} → ${app.esc(alanIsim)}</span>
          </div>` : (gelirMi ? '' : `<div class="tx-odeyen">${app.esc(odeyenIsim)}</div>`);

        return `
          <div class="tx-item">
            <div class="tx-item-body">
              ${!transferMi ? avatarLeft : ''}
              <div class="tx-item-content">
                ${aciklama}
                ${transferArrow}
                <div class="tx-item-meta">
                  ${typePill}
                  <span class="tx-tarih">${i.tarih}</span>
                  ${!izleyici ? `<button class="islem-duzenle" data-id="${i.id}" data-tur="${i.tur}" data-tutar="${i.tutar}" data-aciklama="${app.esc(i.aciklama || '')}" data-tarih="${i.tarih}" data-odeyen="${i.odeyen_ortak_id || i.odeyen_id || ''}"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button>` : ''}
                  ${!izleyici ? `<button class="islem-sil" data-id="${i.id}" title="${t('islem.sil') || 'Sil'}"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>` : ''}
                </div>
              </div>
              <span class="tx-tutar ${transferMi ? 'tx-tutar-transfer' : gelirMi ? 'tx-tutar-gelir' : ''}">${gelirMi ? '+' : ''}${app.formatPara(i.tutar)} <span class="tx-tl">₺</span></span>
            </div>
          </div>`;
      }).join('');
      ikonlariGuncelle();

      if (!list._delegated) {
        list._delegated = true;
        list.addEventListener('click', async (e) => {
          const duzenleBtn = e.target.closest('.islem-duzenle');
          if (duzenleBtn) {
            const d = duzenleBtn.dataset;
            document.getElementById('islem-duzenle-id').value = d.id;
            // Tutar formatla
            const tutarNum = parseFloat(d.tutar);
            const tutarStr = new Intl.NumberFormat('tr-TR').format(tutarNum);
            document.getElementById('islem-duzenle-tutar').value = tutarStr;
            document.getElementById('islem-duzenle-aciklama').value = d.aciklama || '';
            document.getElementById('islem-duzenle-tarih').value = d.tarih;
            // Ödeyen select doldur
            const ortakModu = (app.ortaklar || []).length > 0;
            const odeyenSel = document.getElementById('islem-duzenle-odeyen');
            const kasaOption = app.sirketIsim ? `<option value="__kasa__">🏢 ${app.esc(app.sirketIsim)}</option>` : '';
            const seciliId = d.odeyen;
            if (ortakModu) {
              odeyenSel.innerHTML = kasaOption + app.ortaklar.map(o => `<option value="${o.id}" ${o.id === seciliId ? 'selected' : ''}>${app.esc(o.isim)}</option>`).join('');
            } else {
              odeyenSel.innerHTML = kasaOption + app.uyeler.map(u => `<option value="${u.id}" ${u.id === seciliId ? 'selected' : ''}>${app.esc(u.isim)}</option>`).join('');
            }
            // Transfer ise ödeyen grubunu gizle
            document.getElementById('islem-duzenle-odeyen-group').classList.toggle('hidden', d.tur === 'transfer');
            app.modalAc('modal-islem-duzenle');
            return;
          }
          const btn = e.target.closest('.islem-sil');
          if (!btn) return;
          app.islemSil(parseInt(btn.dataset.id));
        });
      }
    } catch (err) { console.error(err); }
  };

  app.islemSil = async function (id) {
    if (!confirm(t('islem.silOnay'))) return;
    try {
      await API.deleteIslem(id);
      app.titresim();
      app.toast(t('islem.silindi'), 'bilgi');
      await app.yenile();
      app.islemListesiGoster();
    } catch (err) { app.toast(t('hata.hataOneki', { mesaj: err.message }), 'hata'); }
  };
}
