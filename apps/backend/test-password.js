// test-password.js (na raiz do projeto)
const bcrypt = require('bcrypt');

async function testPassword() {
  const password = 'admin123';
  const hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXwtGtrmu3VG';
  
  console.log('Testando senha:', password);
  console.log('Hash do banco:', hash);
  
  const isValid = await bcrypt.compare(password, hash);
  console.log('Senha válida?', isValid);
  
  // Gerar novo hash para comparação
  const newHash = await bcrypt.hash(password, 12);
  console.log('Novo hash gerado:', newHash);
}

testPassword();