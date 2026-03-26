window.AMORT_DIL = window.AMORT_DIL || {};
window.AMORT_DIL.tr = {
  // Uygulama
  app: {
    slogan: 'Ortak Gider Ø Tek Takip',
    hakkinda: 'AMØRT! v2.0 — Ortaklı gider takibi ve borç yönetimi.'
  },

  // Giriş / Kayıt
  auth: {
    epostaPlaceholder: 'E-posta',
    sifrePlaceholder: 'Şifre',
    sifreKayitPlaceholder: 'Şifre (en az 6 karakter)',
    isimPlaceholder: 'İsim',
    girisBtn: 'Giriş Yap',
    kayitBtn: 'Hesap Oluştur',
    girisBasarili: 'Giriş başarılı',
    hesapOlusturuldu: 'Hesap oluşturuldu',
    beniHatirla: 'Beni Hatırla',
    googleGiris: 'Google ile Giriş Yap',
    googleKayit: 'Google ile Kayıt Ol',
    kayitOlLink: 'Kayıt Ol',
    girisYapLink: 'Giriş Yap',
    hesabinizYokMu: 'Hesabınız yok mu?',
    zadenHesabVar: 'Zaten hesabınız var mı?',
    dogrulamaBilgi: 'E-postanızı kontrol edin',
    dogrulamaDetay: 'Hesabınızı doğrulamak için gönderilen bağlantıya tıklayın. (27 dakika geçerli)'
  },

  // Şirket seçici
  sirket: {
    baslik: 'Şirket seçin veya yeni oluşturun',
    yeniPlaceholder: 'Yeni şirket ismi',
    olusturBtn: 'Oluştur',
    cikisBtn: 'Çıkış Yap',
    henuzYok: 'Henüz şirketiniz yok.',
    olusturuldu: '{isim} oluşturuldu',
    bekleyenDavetler: 'Bekleyen Davetler',
    davetKabulBtn: 'Kabul',
    davetRedBtn: 'Red',
    davetKabulEdildi: 'Davet kabul edildi',
    davetReddedildi: 'Davet reddedildi',
    gizleOnay: 'Bireysel kasayı gizlemek istiyor musunuz?',
    gizlendi: 'Bireysel kasa gizlendi',
    gosterildi: 'Bireysel kasa tekrar aktif edildi'
  },

  // Navigasyon
  nav: {
    anaSayfa: 'Ana Sayfa',
    islemler: 'İşlemler',
    uyeler: 'Üyeler',
    ayarlar: 'Ayarlar'
  },

  // Header
  header: {
    degistir: '↔ Değiştir',
    sirketDegistir: 'Şirket Değiştir',
    sirketDegistirTitle: 'Şirket değiştir',
    ayarlar: 'Ayarlar',
    profilTitle: 'Profil'
  },

  // Özet
  ozet: {
    toplamHarcama: 'Toplam Harcama',
    kasaFormat: '{isim}: {tutar} ₺',
    altBilgi: '{sayi} üye • Bireysel: {tutar} ₺',
    bosBaslik: 'Henüz işlem yok.',
    bosAlt: '+ butonuyla harcama ekleyin.',
    bosBaslikTek: 'Harcamalarınızı takip edin',
    bosAltTek: '+ butonuyla ilk harcamanızı ekleyin. Dilediğinizde ortaklarınızı da davet edebilirsiniz.',
    altBilgiTek: 'Bireysel: {tutar} ₺'
  },

  // Bakiye
  bakiye: {
    alacakli: 'alacaklı',
    borclu: 'borçlu',
    esit: 'eşit'
  },

  // Ortaklar
  ortak: {
    baslik: 'Ortaklar',
    ekleBtn: '+ Ortak Ekle',
    henuzYok: 'Henüz ortak yok.',
    silOnay: '"{isim}" ortağını silmek istiyor musunuz?',
    silindi: 'Ortak silindi',
    eklendi: 'Ortak eklendi',
    guncellendi: 'Ortak güncellendi',
    isimPlaceholder: 'Ortak ismi',
    payLabel: 'Pay (%)',
    payPlaceholder: 'Boş = eşit'
  },

  // Borç
  borc: {
    baslik: 'Önerilen Transferler'
  },

  // İşlem
  islem: {
    baslik: 'İşlemler',
    yeniBaslik: 'Yeni İşlem',
    harcamaTab: 'Harcama',
    transferTab: 'Transfer',
    tutarLabel: 'Tutar (₺)',
    tutarPlaceholder: '0.00',
    odeyenLabel: 'Ödeyen',
    alanLabel: 'Alan Kişi',
    notLabel: 'Not (opsiyonel)',
    notPlaceholder: 'Açıklama...',
    tarihLabel: 'Tarih',
    kaydetBtn: 'Kaydet',
    uyeYok: 'Üye yok',
    sirketKasasi: 'Şirket Kasası',
    henuzYok: 'Henüz işlem yok.',
    kasaEklendi: 'Kasa harcaması eklendi',
    transferKaydedildi: 'Transfer kaydedildi',
    harcamaEklendi: 'Harcama eklendi',
    ayniKisiHata: 'Ödeyen ve alan aynı kişi olamaz!',
    kasaKasaHata: 'Kasadan kasaya transfer yapılamaz!',
    henuzUyeYok: 'Henüz üye yok!',
    silOnay: 'Bu işlemi silmek istediğinize emin misiniz?',
    silindi: 'İşlem silindi',
    fabTitle: 'Yeni İşlem'
  },

  // İşlem türü badge
  tur: {
    kasa: 'Kasa',
    transfer: 'Transfer',
    harcama: 'Harcama'
  },

  // Üyeler
  uye: {
    baslik: 'Üyeler',
    davetBtn: '+ Davet Et',
    henuzYok: 'Henüz üye yok.',
    silOnay: '"{isim}" üyesini çıkarmak istediğinize emin misiniz?',
    cikarildi: 'Üye çıkarıldı',
    rolGuncellendi: 'Rol güncellendi',
    gonderilenDavetler: 'Gönderilen Davetler',
    ortakLabel: 'Atandığı Ortak',
    ortakYok: 'Atanmamış',
    sadeceKendiOrtagi: 'Sadece kendi ortağı adına'
  },

  // Davet
  davet: {
    baslik: 'Davet Gönder',
    epostaLabel: 'E-posta',
    epostaPlaceholder: 'ortak@email.com',
    rolLabel: 'Rol',
    gonderBtn: 'Davet Gönder',
    gonderildi: 'Davet gönderildi'
  },

  // Roller
  rol: {
    yonetici: 'Yönetici',
    uye: 'Üye',
    izleyici: 'İzleyici'
  },

  // Rol açıklamaları (davet dropdown)
  rolAciklama: {
    uye: 'Üye (harcama ekleyebilir)',
    izleyici: 'İzleyici (sadece görüntüler)',
    yonetici: 'Yönetici (tam yetki)'
  },

  // Davet durumları
  durum: {
    bekliyor: 'Bekliyor',
    kabul: 'Kabul Edildi',
    red: 'Reddedildi'
  },

  // Ayarlar
  ayarlar: {
    baslik: 'Ayarlar',
    hesap: 'Hesap',
    hakkinda: 'Hakkında',
    cikisBtn: 'Çıkış Yap',
    rol: 'Rol: {rol}',
    dil: 'Dil',
    dilSecimi: 'Dil seçimi',
    metinAyarlari: 'Metin Ayarları',
    harfBicimi: 'Harf Biçimi',
    harfBuyuk: 'BÜYÜK HARF',
    harfKucuk: 'küçük harf',
    harfOlduguGibi: 'Olduğu gibi',
    trTemizle: 'Türkçe karakterleri kaldır',
    trTemizleAciklama: 'ş→s, ç→c, ğ→g, ı→i, ö→o, ü→u',
    ayarKaydedildi: 'Ayarlar kaydedildi',
    kisiselKasaAc: 'Bireysel Kasayı Tekrar Aç'
  },

  // Hatalar
  cop: {
    baslik: 'Çöp Kutusu',
    islemler: 'Silinmiş İşlemler',
    uyeler: 'Çıkarılmış Üyeler',
    geriAlBtn: 'Geri Al',
    geriAlindi: 'Başarıyla geri alındı',
    bos: 'Çöp kutusu boş.'
  },

  cevrimdisi: {
    cevrimdisi: 'İnternet bağlantınız kesildi. İşlemler kuyruğa alınacak.',
    tekrarBagli: 'İnternet bağlantısı yeniden sağlandı!',
    senkronEdildi: '{sayi} bekleyen işlem senkronize edildi.',
    senkronHatasi: '{sayi} işlem senkronize edilemedi.',
    kuyrugaEklendi: 'Çevrimdışısınız, işlem kuyruğa alındı.'
  },

  bildirim: {
    yeniHarcama: '{isim} {tutar} ₺ harcama ekledi',
    yeniTransfer: '{kimden} → {kime} {tutar} ₺ transfer etti',
    islemSilindi: 'Bir işlem silindi',
    yeniUye: '{isim} gruba katıldı',
    uyeAyrildi: '{isim} gruptan çıkarıldı'
  },

  hata: {
    oturumDoldu: 'Oturum süresi doldu',
    genelHata: 'Bir hata oluştu',
    veriYuklenemedi: 'Veriler yüklenemedi: {mesaj}',
    hataOneki: 'Hata: {mesaj}',
    agHatasi: 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.',
    cevrimdisi: 'İnternet bağlantınız yok. Çevrimiçi olduğunuzda tekrar deneyin.',
    istekIptal: 'İstek iptal edildi.',
    zamanAsimi: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.'
  }
};
