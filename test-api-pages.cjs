require('dotenv').config();

async function test() {
  const url = `https://sprinthub-api-master.sprinthub.app/leads?i=oficialmed&page=1&limit=5&apitoken=9ad36c85-5858-4960-9935-e73c3698dd0c`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  console.log('📦 ESTRUTURA DA RESPOSTA:');
  console.log(JSON.stringify(data, null, 2));
}

test();
