// generate-hash.js
const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'admin123';
  const saltRounds = 12;
  
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Senha:', password);
  console.log('Hash gerado:', hash);
  
  // Testar o hash
  const isValid = await bcrypt.compare(password, hash);
  console.log('Verificação:', isValid);
}

generateHash();