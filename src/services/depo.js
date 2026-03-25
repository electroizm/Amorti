/**
 * Depo Seçici
 * USE_SUPABASE=true → Supabase, false → Bellek
 */

if (process.env.USE_SUPABASE === 'true') {
  console.log('📦 Supabase depo aktif');
  module.exports = require('./supabase-depo');
} else {
  console.log('📦 Bellek depo aktif (geliştirme modu)');
  module.exports = require('./bellek-depo');
}
