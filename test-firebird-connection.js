// Script para testar conexão com Firebird
import fetch from 'node-fetch';

async function testFirebirdConnection() {
  try {
    console.log('🧪 Testando conexão com Firebird...');
    
    const response = await fetch('http://localhost:3002/api/firebird/test-connection');
    const data = await response.json();
    
    console.log('✅ Resposta da API:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('🎉 Conexão com Firebird estabelecida com sucesso!');
      console.log('📊 Dados do servidor:', data.data);
    } else {
      console.log('❌ Falha na conexão:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error.message);
  }
}

testFirebirdConnection();

