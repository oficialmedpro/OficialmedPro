// Configuração do Backend Proxy Google Ads
// Copie este arquivo para config.js e preencha com suas credenciais reais

module.exports = {
  // Configurações do Supabase
  supabase: {
    url: 'https://your-project.supabase.co', // Substitua pela sua URL do Supabase
    anonKey: 'your-anon-key' // Substitua pela sua chave anônima do Supabase
  },
  
  // Configurações do servidor
  server: {
    port: process.env.PORT || 3001,
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000'], // URLs permitidas
      credentials: true
    }
  },
  
  // Configurações do Google Ads API
  googleAds: {
    // Estas configurações serão carregadas do banco de dados
    // Não é necessário definir aqui
  }
};
