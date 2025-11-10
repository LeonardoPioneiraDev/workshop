// test-hash.js (na raiz do projeto)
const bcrypt = require('bcryptjs');

async function testHash() {
  const password = 'admin123';
  const storedHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXwtGtrmu3VG';
  
  console.log('Testando senha:', password);
  console.log('Hash armazenado:', storedHash);
  
  // Testar com bcryptjs (que o backend usa)
  const isValid = await bcrypt.compare(password, storedHash);
  console.log('Senha válida com bcryptjs?', isValid);
  
  // Gerar novo hash com bcryptjs
  const newHash = await bcrypt.hash(password, 12);
  console.log('Novo hash gerado:', newHash);
  
  // Testar o novo hash
  const newIsValid = await bcrypt.compare(password, newHash);
  console.log('Novo hash válido?', newIsValid);
}

testHash().catch(console.error);