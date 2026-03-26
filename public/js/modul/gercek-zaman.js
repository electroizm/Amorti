/**
 * AMØRT! Supabase Realtime Modülü
 * islemler ve uyeler tablolarındaki değişiklikleri dinler,
 * App.yenile() ile ekranı otomatik günceller.
 *
 * Not: Supabase JS client CDN'den yüklenmeli:
 * <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 * ve SUPABASE_URL + SUPABASE_ANON_KEY global olmalı.
 */
window.GercekZaman = {
  kanal: null,

  /**
   * Realtime kanalına abone ol
   * @param {string} supabaseUrl
   * @param {string} supabaseKey
   * @param {string} token - kullanıcı JWT
   * @param {string} sirketId
   */
  baslat(supabaseUrl, supabaseKey, token, sirketId) {
    // Supabase client yoksa sessizce çık
    if (!window.supabase?.createClient) {
      console.warn('Supabase JS client yüklenmemiş, realtime devre dışı.');
      return;
    }

    // Önceki kanalı kapat
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
        console.log('Realtime islem:', payload.eventType);
        App.yenile();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'uyeler',
        filter: `sirket_id=eq.${sirketId}`
      }, (payload) => {
        console.log('Realtime uye:', payload.eventType);
        App.yenile();
      })
      .subscribe((status) => {
        console.log('Realtime durum:', status);
      });
  },

  /**
   * Kanalı kapat
   */
  durdur() {
    if (this.kanal) {
      this.kanal.unsubscribe();
      this.kanal = null;
    }
  }
};
