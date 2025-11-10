// apps/backend/run-migration-multa-completa.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Executando migration de Multas Completas...');

// Verificar se a migration existe
const migrationPath = path.join(__dirname, 'src/migrations/1757010000000-CreateMultaCompletaTable.ts');

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Arquivo de migration não encontrado:', migrationPath);
  process.exit(1);
}

try {
  // Compilar TypeScript primeiro
  console.log('📦 Compilando TypeScript...');
  execSync('npm run build', { stdio: 'inherit' });

  // Executar migration
  console.log('🗄️ Executando migration...');
  execSync('npx typeorm migration:run -d dist/database/data-source.js', { stdio: 'inherit' });

  console.log('✅ Migration executada com sucesso!');
} catch (error) {
  console.error('❌ Erro ao executar migration:', error.message);
  process.exit(1);
}