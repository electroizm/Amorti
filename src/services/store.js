/**
 * In-Memory Store
 * Supabase bağlanana kadar geliştirme için kullanılır.
 * USE_SUPABASE=true yapıldığında Supabase'e geçiş yapılır.
 */
const crypto = require('crypto');

const data = {
  partners: [],
  transactions: []
};

let transactionCounter = 0;

// --- Partners ---

function getPartners() {
  return data.partners;
}

function addPartner(partner) {
  const newPartner = {
    id: crypto.randomUUID(),
    name: partner.name,
    color: partner.color,
    created_at: new Date().toISOString()
  };
  data.partners.push(newPartner);
  return newPartner;
}

function updatePartner(id, updates) {
  const idx = data.partners.findIndex(p => p.id === id);
  if (idx === -1) return null;
  Object.assign(data.partners[idx], updates);
  return data.partners[idx];
}

function deletePartner(id) {
  const idx = data.partners.findIndex(p => p.id === id);
  if (idx === -1) return null;
  data.partners.splice(idx, 1);
  return true;
}

// --- Transactions ---

function getTransactions() {
  return data.transactions.filter(t => !t.is_deleted);
}

function getAllTransactions() {
  return data.transactions;
}

function addTransaction(tx) {
  transactionCounter++;
  const newTx = {
    id: transactionCounter,
    type: tx.type || 'harcama',
    payer_id: tx.payer_id,
    receiver_id: tx.receiver_id || null,
    amount: parseFloat(tx.amount),
    description: tx.description || '',
    is_deleted: false,
    date: tx.date || new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString()
  };
  data.transactions.push(newTx);
  return newTx;
}

function softDeleteTransaction(id) {
  const tx = data.transactions.find(t => t.id === id);
  if (!tx) return null;
  tx.is_deleted = true;
  return tx;
}

module.exports = {
  getPartners, addPartner, updatePartner, deletePartner,
  getTransactions, getAllTransactions, addTransaction, softDeleteTransaction
};
