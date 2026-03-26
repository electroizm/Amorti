/**
 * AMØRT! Supabase Realtime Modülü
 * islemler ve uyeler tablolarındaki değişiklikleri dinler,
 * bildirim toast'u gösterir ve App.yenile() ile ekranı günceller.
 */
window.GercekZaman = {
  kanal: null,

  /**
   * Realtime kanalına abone ol
   */
  baslat(supabaseUrl, supabaseKey, token, sirketId) {
    if (!window.supabase?.createClient) {
      console.warn('Supabase JS client yüklenmemiş, realtime devre dışı.');
      return;
    }

    this.durdur();

    const client = window.supabase.createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    this.kanal = client
      .channel(`sirket-${sirketId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'islemler',
        filter: `sirket_id=eq.${sirketId}`
      }, (payload) => {
        this.bildirimGoster('islem', payload);
        App.yenile();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'uyeler',
        filter: `sirket_id=eq.${sirketId}`
      }, (payload) => {
        this.bildirimGoster('uye', payload);
        App.yenile();
      })
      .subscribe();
  },

  /**
   * Kanalı kapat
   */
  durdur() {
    if (this.kanal) {
      this.kanal.unsubscribe();
      this.kanal = null;
    }
  },

  /**
   * Realtime olayından bildirim toast'u oluştur
   * Kendi işlemlerini gösterme — sadece başkalarının aksiyonları
   */
  bildirimGoster(tablo, payload) {
    const kullanici = API.getKullanici();
    const veri = payload.new || {};

    // Kendi aksiyonlarımızı atla
    if (veri.ekleyen_id === kullanici?.id) return;
    if (veri.kullanici_id === kullanici?.id && payload.eventType === 'INSERT') return;

    const uyeMap = {};
    App.uyeler.forEach(u => { uyeMap[u.id] = u; });

    let mesaj = '';

    if (tablo === 'islem') {
      if (payload.eventType === 'INSERT') {
        if (veri.tur === 'transfer') {
          const kimden = veri.kasa_mi ? App.sirketIsim : (uyeMap[veri.odeyen_id]?.isim || '?');
          const kime = veri.alan_kasa_mi ? App.sirketIsim : (uyeMap[veri.alan_id]?.isim || '?');
          mesaj = t('bildirim.yeniTransfer', { kimden, kime, tutar: App.formatPara(veri.tutar) });
        } else {
          const isim = veri.kasa_mi ? App.sirketIsim : (uyeMap[veri.odeyen_id]?.isim || '?');
          mesaj = t('bildirim.yeniHarcama', { isim, tutar: App.formatPara(veri.tutar) });
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
      App.toast(mesaj, 'bilgi');
      App.titresim(50);
    }
  }
};
