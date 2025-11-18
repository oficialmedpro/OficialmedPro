require('dotenv').config();

async function test() {
  const url = `https://sprinthub-api-master.sprinthub.app/leads?i=oficialmed&page=1&limit=3&allFields=1&apitoken=9ad36c85-5858-4960-9935-e73c3698dd0c`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  const leads = data.data.leads;
  
  console.log('📋 EXEMPLO DE LEAD DA API:');
  console.log(JSON.stringify(leads[0], null, 2));
  
  console.log('\n🔑 Campos importantes:');
  console.log(`id: ${leads[0].id}`);
  console.log(`whatsapp: ${leads[0].whatsapp}`);
  console.log(`phone: ${leads[0].phone}`);
  console.log(`mobile: ${leads[0].mobile}`);
}

test();
