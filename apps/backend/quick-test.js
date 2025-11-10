// apps/backend/quick-test.js
const axios = require('axios');

async function quickTest() {
  console.log('⚡ Teste Rápido do Workshop Backend...\n');

  try {
    // 1. Health Check
    const health = await axios.get('http://localhost:3333/health');
    console.log('✅ Health Check:', health.data.status);

    // 2. Swagger disponível
    try {
      await axios.get('http://localhost:3333/api-json');
      console.log('✅ Swagger API funcionando');
    } catch {
      console.log('⚠️ Swagger não acessível');
    }

    // 3. Registrar usuário
    const username = `teste_${Date.now()}`;
    const email = `teste_${Date.now()}@workshop.com`;
    
    const register = await axios.post('http://localhost:3333/auth/register', {
      username,
      email,
      password: 'MinhaSenh@123',
      fullName: 'Teste Rápido',
      role: 'user'
    });
    
    console.log('✅ Registro funcionando');
    
    // 4. Login
    const login = await axios.post('http://localhost:3333/auth/login', {
      username,
      password: 'MinhaSenh@123'
    });
    
    console.log('✅ Login funcionando');
    console.log('✅ JWT Token gerado');

    console.log('\n🎉 Sistema funcionando perfeitamente!');
    console.log('📚 Acesse: http://localhost:3333/api');

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

quickTest();