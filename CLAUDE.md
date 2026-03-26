# AMØRT! - Proje Rehberi

## Mimari
- **Backend:** Node.js + Express (`sunucu.js`)
- **Frontend:** Vanilla JS SPA (`public/index.html` + `public/js/`)
- **Veritabani:** Supabase (PostgreSQL + Auth + RLS)
- **CSS:** Tailwind via CDN
- **PWA:** Service Worker + manifest.json

## Dosya Yapisi
```
sunucu.js                    # Express ana sunucu
public/
  index.html                 # SPA ana HTML
  js/uygulama.js             # App mantigi
  js/istemci.js              # API istemcisi
  js/halka.js                # O Ring (kaldirilacak)
  sw.js, manifest.json       # PWA
src/
  middleware/auth.js          # JWT + sirket baglami + rol kontrolu
  routes/auth.js              # Kayit, giris, cikis
  routes/sirketler.js         # Sirket CRUD
  routes/davetler.js          # Davet gonder/kabul/red
  routes/islemler.js          # Harcama/transfer CRUD (sirket bazli)
  routes/ortaklar.js          # Uye yonetimi (sirket bazli)
  services/borc.js            # Borc sadelestirme algoritması
  services/metin.js           # Metin formatlama (harf bicimi + TR toggle)
  services/depo.js            # Depo secici (bellek/supabase)
  services/bellek-depo.js     # In-memory store (dev)
  services/supabase-depo.js   # Supabase store (eski, v1)
db/kurulum.sql               # v2 sema: 5 tablo + RLS
```

## V2 Gecis Durumu

### [x] 1. Auth UI (Giris/Kayit)
- public/index.html: auth ekranlari eklendi
- public/js/istemci.js: token yonetimi + auth API
- public/js/uygulama.js: auth akisi

### [x] 2. Sirket Secici
- Sirket olustur/sec ekrani
- X-Sirket-Id header ile API cagrilari
- localStorage'da aktif sirket

### [x] 3. Kasa + Varsayilan Odeyen
- Harcama formuna "Sirket Kasasi" secenegi
- Varsayilan odeyen = giris yapan kullanici
- kasa_mi field backend'de zaten var

### [x] 4. Borc Hesaplama Guncelle
- borc.js: kasa_mi=true olanlari borc hesabindan haric tut
- Kasa harcamalari toplam giderde gorunur

### [x] 5. O Ring Kaldir
- halka.js referanslari kaldirildi
- Ana sayfada toplam harcama ozeti gosteriliyor

### [x] 6. Tema: Acik Gri Varsayilan
- Varsayilan tema light (acik gri #f1f5f9)
- Koyu tema opsiyonel

### [x] 7. Davet UI
- E-posta ile davet gonderme
- Bekleyen davetleri gorme/kabul/red

### [x] 8. Izleyici Kisitlamasi
- izleyici rolu: FAB gizli, form disabled
- Sadece goruntuleyebilir

### [x] 9. Sunucu Guncelleme
- sunucu.js: yeni route'lar eklendi (auth, sirketler, davetler)
- /api/ozet: sirket bazli + kasa destegi
