/**
 * AMØRT! Supabase Realtime Modülü (ES Module)
 */
import { t } from '../dil/i18n.js';
import { API } from '../api.js';

export const GercekZaman = {
  kanal: null,

  async baslat(token, sirketId) {
    const config = await fetch('/api/config').then(r => r.json());
    if (!config.supabaseUrl || !token || !sirketId) return;

    this.durdur();

    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(config.supabaseUrl, config.supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    this.kanal = client
      .channel(`sirket-${sirketId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'islemler',
        filter: `sirket_id=eq.${sirketId}`
      }, (payload) => {
        this._bildirimGoster(payload, 'islem');
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'uyeler',
        filter: `sirket_id=eq.${sirketId}`
      }, (payload) => {
        this._bildirimGoster(payload, 'uye');
      })
      .subscribe();
  },

  durdur() {
    if (this.kanal) {
      this.kanal.unsubscribe();
      this.kanal = null;
    }
  },

  // app referansı init sırasında bağlanacak
  _app: null,

  _bildirimGoster(payload, tablo) {
    const app = this._app;
    if (!app) return;

    const kullanici = API.getKullanici();
    const veri = payload.new || {};

    if (veri.ekleyen_id === kullanici?.id) return;
    if (veri.kullanici_id === kullanici?.id && payload.eventType === 'INSERT') return;

    const uyeMap = {};
    app.uyeler.forEach(u => { uyeMap[u.id] = u; });

    let mesaj = '';

    if (tablo === 'islem') {
      if (payload.eventType === 'INSERT') {
        if (veri.tur === 'transfer') {
          const kimden = veri.kasa_mi ? app.sirketIsim : (uyeMap[veri.odeyen_id]?.isim || '?');
          const kime = veri.alan_kasa_mi ? app.sirketIsim : (uyeMap[veri.alan_id]?.isim || '?');
          mesaj = t('bildirim.yeniTransfer', { kimden, kime, tutar: app.formatPara(veri.tutar) });
        } else {
          const isim = veri.kasa_mi ? app.sirketIsim : (uyeMap[veri.odeyen_id]?.isim || '?');
          mesaj = t('bildirim.yeniHarcama', { isim, tutar: app.formatPara(veri.tutar) });
        }
      } else if (payload.eventType === 'UPDATE' && veri.silinmis) {
        mesaj = t('bildirim.islemSilindi');
      }
    } else if (tablo === 'uye') {
      if (payload.eventType === 'INSERT') {
        mesaj = t('bildirim.yeniUye', { isim: veri.isim || '?' });
      } else if (payload.eventType === 'UPDATE' && veri.silinmis) {
        mesaj = t('bildirim.uyeAyrildi', { isim: veri.isim || '?' });
      }
    }

    if (mesaj) {
      app.toast(mesaj, 'bilgi');
      app.titresim(50);
      app.yenile();
    }
  }
};
