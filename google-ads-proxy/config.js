// Configuração do Backend Proxy Google Ads
// Copie este arquivo para config.js e preencha com suas credenciais reais

module.exports = {
  // Configurações do Supabase - credenciais reais
  supabase: {
    url: 'https://agdffspstbxeqhqtltvb.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA'
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
