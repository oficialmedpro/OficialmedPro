import dotenv from 'dotenv';
dotenv.config();

const CONFIG = {
  SPRINTHUB: {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN,
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed',
  }
};

async function testTagsEndpoint() {
  const url = `https://${CONFIG.SPRINTHUB.baseUrl}/tags?query={tags{id,tag,color}}&i=${CONFIG.SPRINTHUB.instance}&apitoken=${CONFIG.SPRINTHUB.apiToken}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CONFIG.SPRINTHUB.apiToken}`,
        'Accept': 'application/json'
      }
    });
    const data = await response.json();
    if (response.ok) {
      console.log('Retorno das tags:', JSON.stringify(data, null, 2));
    } else {
      console.error('Erro na resposta:', data);
    }
  } catch (error) {
    console.error('Erro na requisição:', error.message);
  }
}

testTagsEndpoint();
