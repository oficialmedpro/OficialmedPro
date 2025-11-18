require('dotenv').config();

async function test() {
  const url = `https://sprinthub-api-master.sprinthub.app/leads?i=oficialmed&page=1&limit=2&allFields=1&apitoken=9ad36c85-5858-4960-9935-e73c3698dd0c`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  console.log('📦 COM allFields=1:');
  console.log(JSON.stringify(data, null, 2));
  
  if (data.data && data.data.leads && data.data.leads[0]) {
    console.log('\n🔑 Campos disponíveis:');
    console.log(Object.keys(data.data.leads[0]).join(', '));
  }
}

test();
