/**
 * Supabase Store - Veritabanı işlemleri
 * Tablo: ortaklar, islemler
 */
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// --- Ortaklar ---

async function getPartners() {
  const { data, error } = await supabase
    .from('ortaklar')
    .select('*')
    .eq('silinmis', false)
    .order('olusturma_tarihi', { ascending: true });

  if (error) throw error;
  return data.map(mapPartner);
}

async function addPartner({ isim, renk }) {
  const { data, error } = await supabase
    .from('ortaklar')
    .insert({ isim, renk })
    .select()
    .single();

  if (error) throw error;
  return mapPartner(data);
}

async function updatePartner(id, updates) {
  const mapped = {};
  if (updates.isim !== undefined) mapped.isim = updates.isim;
  if (updates.renk !== undefined) mapped.renk = updates.renk;

  const { data, error } = await supabase
    .from('ortaklar')
    .update(mapped)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data ? mapPartner(data) : null;
}

async function deletePartner(id) {
  const { data, error } = await supabase
    .from('ortaklar')
    .update({ silinmis: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return !!data;
}

// --- İşlemler ---

async function getTransactions() {
  const { data, error } = await supabase
    .from('islemler')
    .select('*')
    .eq('silinmis', false)
    .order('olusturma_tarihi', { ascending: true });

  if (error) throw error;
  return data.map(mapTransaction);
}

async function getAllTransactions() {
  const { data, error } = await supabase
    .from('islemler')
    .select('*')
    .order('olusturma_tarihi', { ascending: true });

  if (error) throw error;
  return data.map(mapTransaction);
}

async function addTransaction({ tur, odeyen_id, alan_id, tutar, aciklama, tarih }) {
  const row = {
    tur: tur || 'harcama',
    odeyen_id,
    alan_id: alan_id || null,
    tutar: parseFloat(tutar),
    aciklama: aciklama || '',
    tarih: tarih || new Date().toISOString().split('T')[0]
  };

  const { data, error } = await supabase
    .from('islemler')
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return mapTransaction(data);
}

async function softDeleteTransaction(id) {
  const { data, error } = await supabase
    .from('islemler')
    .update({ silinmis: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data ? mapTransaction(data) : null;
}

// --- Mappers (DB → App format) ---

function mapPartner(row) {
  return {
    id: row.id,
    isim: row.isim,
    renk: row.renk,
    silinmis: row.silinmis,
    olusturma_tarihi: row.olusturma_tarihi
  };
}

function mapTransaction(row) {
  return {
    id: row.id,
    tur: row.tur,
    odeyen_id: row.odeyen_id,
    alan_id: row.alan_id,
    tutar: parseFloat(row.tutar),
    aciklama: row.aciklama,
    tarih: row.tarih,
    silinmis: row.silinmis,
    olusturma_tarihi: row.olusturma_tarihi
  };
}

module.exports = {
  getPartners, addPartner, updatePartner, deletePartner,
  getTransactions, getAllTransactions, addTransaction, softDeleteTransaction
};
