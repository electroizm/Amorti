/**
 * Borç Sadeleştirme (Debt Simplification) Servisi
 * Greedy algoritma ile minimum transfer sayısı hesaplar.
 */

function calculateBalances(partners, transactions) {
  const balances = {};
  partners.forEach(p => { balances[p.id] = 0; });

  const active = transactions.filter(t => !t.is_deleted);
  const n = partners.length;
  if (n === 0) return balances;

  for (const t of active) {
    if (t.type === 'harcama') {
      // Ödeyen kişi herkese harcadı, herkes kendi payını borçlu
      const share = t.amount / n;
      balances[t.payer_id] += t.amount;
      partners.forEach(p => { balances[p.id] -= share; });
    } else if (t.type === 'transfer') {
      // Direkt transfer: payer → receiver
      balances[t.payer_id] += t.amount;
      balances[t.receiver_id] -= t.amount;
    }
  }

  // Küçük kalan hataları temizle
  for (const id of Object.keys(balances)) {
    balances[id] = Math.round(balances[id] * 100) / 100;
  }

  return balances;
}

function simplifyDebts(partners, transactions) {
  const balances = calculateBalances(partners, transactions);

  const creditors = []; // Alacaklılar (pozitif bakiye)
  const debtors = [];   // Borçlular (negatif bakiye)

  for (const [id, balance] of Object.entries(balances)) {
    if (balance > 0.01) {
      creditors.push({ id, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ id, amount: Math.abs(balance) });
    }
  }

  // Büyükten küçüğe sırala
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    transfers.push({
      from: debtors[i].id,
      to: creditors[j].id,
      amount: Math.round(amount * 100) / 100
    });

    debtors[i].amount -= amount;
    creditors[j].amount -= amount;

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return { balances, transfers };
}

module.exports = { calculateBalances, simplifyDebts };
