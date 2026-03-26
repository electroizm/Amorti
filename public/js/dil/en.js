window.AMORT_DIL = window.AMORT_DIL || {};
window.AMORT_DIL.en = {
  app: {
    slogan: 'Shared expense tracking',
    hakkinda: 'AMØRT! v2.0 — Shared expense tracking & debt management.'
  },

  auth: {
    tabGiris: 'Login',
    tabKayit: 'Sign Up',
    epostaPlaceholder: 'Email',
    sifrePlaceholder: 'Password',
    sifreKayitPlaceholder: 'Password (min 6 characters)',
    isimPlaceholder: 'Name',
    girisBtn: 'Log In',
    kayitBtn: 'Create Account',
    girisBasarili: 'Login successful',
    hesapOlusturuldu: 'Account created'
  },

  sirket: {
    baslik: 'Select a company or create new',
    yeniPlaceholder: 'New company name',
    olusturBtn: 'Create',
    cikisBtn: 'Log Out',
    henuzYok: 'No companies yet.',
    olusturuldu: '{isim} created',
    bekleyenDavetler: 'Pending Invitations',
    davetKabulBtn: 'Accept',
    davetRedBtn: 'Decline',
    davetKabulEdildi: 'Invitation accepted',
    davetReddedildi: 'Invitation declined'
  },

  nav: {
    anaSayfa: 'Home',
    islemler: 'Transactions',
    uyeler: 'Members',
    ayarlar: 'Settings'
  },

  header: {
    degistir: '↔ Switch',
    sirketDegistirTitle: 'Switch company',
    profilTitle: 'Profile'
  },

  ozet: {
    toplamHarcama: 'Total Expenses',
    kasaFormat: 'Fund: {tutar} ₺',
    altBilgi: '{sayi} members • Personal: {tutar} ₺',
    bosBaslik: 'No transactions yet.',
    bosAlt: 'Tap + to add an expense.'
  },

  bakiye: {
    alacakli: 'creditor',
    borclu: 'debtor',
    esit: 'even'
  },

  borc: {
    baslik: 'Suggested Transfers'
  },

  islem: {
    baslik: 'Transactions',
    yeniBaslik: 'New Transaction',
    harcamaTab: 'Expense',
    transferTab: 'Transfer',
    tutarLabel: 'Amount (₺)',
    tutarPlaceholder: '0.00',
    odeyenLabel: 'Paid by',
    alanLabel: 'Recipient',
    notLabel: 'Note (optional)',
    notPlaceholder: 'Description...',
    tarihLabel: 'Date',
    kaydetBtn: 'Save',
    uyeYok: 'No members',
    sirketKasasi: 'Company Fund',
    henuzYok: 'No transactions yet.',
    kasaEklendi: 'Fund expense added',
    transferKaydedildi: 'Transfer saved',
    harcamaEklendi: 'Expense added',
    ayniKisiHata: 'Payer and recipient cannot be the same!',
    henuzUyeYok: 'No members yet!',
    silOnay: 'Are you sure you want to delete this transaction?',
    silindi: 'Transaction deleted',
    fabTitle: 'New Transaction'
  },

  tur: {
    kasa: 'Fund',
    transfer: 'Transfer',
    harcama: 'Expense'
  },

  uye: {
    baslik: 'Members',
    davetBtn: '+ Invite',
    henuzYok: 'No members yet.',
    silOnay: 'Are you sure you want to remove "{isim}"?',
    cikarildi: 'Member removed',
    rolGuncellendi: 'Role updated',
    gonderilenDavetler: 'Sent Invitations'
  },

  davet: {
    baslik: 'Send Invitation',
    epostaLabel: 'Email',
    epostaPlaceholder: 'partner@email.com',
    rolLabel: 'Role',
    gonderBtn: 'Send Invitation',
    gonderildi: 'Invitation sent'
  },

  rol: {
    yonetici: 'Admin',
    uye: 'Member',
    izleyici: 'Viewer'
  },

  rolAciklama: {
    uye: 'Member (can add expenses)',
    izleyici: 'Viewer (read only)',
    yonetici: 'Admin (full access)'
  },

  durum: {
    bekliyor: 'Pending',
    kabul: 'Accepted',
    red: 'Declined'
  },

  ayarlar: {
    baslik: 'Settings',
    hesap: 'Account',
    hakkinda: 'About',
    cikisBtn: 'Log Out',
    rol: 'Role: {rol}',
    dil: 'Language',
    dilSecimi: 'Language selection',
    metinAyarlari: 'Text Settings',
    harfBicimi: 'Letter Case',
    harfBuyuk: 'UPPERCASE',
    harfKucuk: 'lowercase',
    harfOlduguGibi: 'As is',
    trTemizle: 'Remove Turkish characters',
    trTemizleAciklama: 'ş→s, ç→c, ğ→g, ı→i, ö→o, ü→u',
    ayarKaydedildi: 'Settings saved'
  },

  cop: {
    baslik: 'Trash',
    islemler: 'Deleted Transactions',
    uyeler: 'Removed Members',
    geriAlBtn: 'Restore',
    geriAlindi: 'Successfully restored',
    bos: 'Trash is empty.'
  },

  cevrimdisi: {
    cevrimdisi: 'You are offline. Actions will be queued.',
    tekrarBagli: 'Back online!',
    senkronEdildi: '{sayi} pending action(s) synced.',
    senkronHatasi: '{sayi} action(s) failed to sync.',
    kuyrugaEklendi: 'You are offline, action queued.'
  },

  hata: {
    oturumDoldu: 'Session expired',
    genelHata: 'An error occurred',
    veriYuklenemedi: 'Failed to load data: {mesaj}',
    hataOneki: 'Error: {mesaj}',
    agHatasi: 'Cannot connect to server. Check your internet connection.',
    cevrimdisi: 'You are offline. Try again when connected.',
    istekIptal: 'Request cancelled.',
    zamanAsimi: 'Request timed out. Please try again.'
  }
};
