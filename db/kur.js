/**
 * AMØRT! Veritabanı Kurulum Scripti
 * Supabase PostgreSQL'e bağlanıp tabloları oluşturur.
 * Kullanım: npm run db-kur
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('❌ DATABASE_URL .env dosyasında tanımlı değil!');
  process.exit(1);
}

async function kur() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

  try {
    console.log('🔌 Supabase veritabanına bağlanılıyor...');
    await client.connect();
    console.log('✅ Bağlantı başarılı!');

    const sql = fs.readFileSync(path.join(__dirname, 'kurulum.sql'), 'utf8');
    console.log('📦 Tablolar oluşturuluyor...');
    await client.query(sql);
    console.log('✅ Tablolar başarıyla oluşturuldu!');

    // Doğrulama
    const { rows } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('ortaklar', 'islemler')
      ORDER BY table_name
    `);
    console.log('📋 Mevcut tablolar:', rows.map(r => r.table_name).join(', '));

  } catch (err) {
    console.error('❌ Hata:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

kur();
