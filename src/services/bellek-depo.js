/**
 * In-Memory Store (Geliştirme için)
 * Türkçe alan adlarıyla
 */
const crypto = require('crypto');

const veri = {
  ortaklar: [],
  islemler: []
};

let islemSayaci = 0;

// --- Ortaklar ---

function getPartners() {
  return veri.ortaklar.filter(o => !o.silinmis);
}

function addPartner({ isim, renk }) {
  const yeni = {
    id: crypto.randomUUID(),
    isim,
    renk,
    silinmis: false,
    olusturma_tarihi: new Date().toISOString()
  };
  veri.ortaklar.push(yeni);
  return yeni;
}

function updatePartner(id, updates) {
  const idx = veri.ortaklar.findIndex(o => o.id === id);
  if (idx === -1) return null;
  if (updates.isim !== undefined) veri.ortaklar[idx].isim = updates.isim;
  if (updates.renk !== undefined) veri.ortaklar[idx].renk = updates.renk;
  return veri.ortaklar[idx];
}

function deletePartner(id) {
  const ortak = veri.ortaklar.find(o => o.id === id);
  if (!ortak) return null;
  ortak.silinmis = true;
  return true;
}

// --- İşlemler ---

function getTransactions() {
  return veri.islemler.filter(i => !i.silinmis);
}

function getAllTransactions() {
  return veri.islemler;
}

function addTransaction({ tur, odeyen_id, alan_id, tutar, aciklama, tarih }) {
  islemSayaci++;
  const yeni = {
    id: islemSayaci,
    tur: tur || 'harcama',
    odeyen_id,
    alan_id: alan_id || null,
    tutar: parseFloat(tutar),
    aciklama: aciklama || '',
    tarih: tarih || new Date().toISOString().split('T')[0],
    silinmis: false,
    olusturma_tarihi: new Date().toISOString()
  };
  veri.islemler.push(yeni);
  return yeni;
}

function softDeleteTransaction(id) {
  const islem = veri.islemler.find(i => i.id === id);
  if (!islem) return null;
  islem.silinmis = true;
  return islem;
}

module.exports = {
  getPartners, addPartner, updatePartner, deletePartner,
  getTransactions, getAllTransactions, addTransaction, softDeleteTransaction
};
