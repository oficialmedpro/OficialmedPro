// Configuração do Backend Proxy Google Ads para VPS
// Este arquivo deve ser renomeado para config.js na VPS

module.exports = {
  // Configurações do Supabase
  supabase: {
    url: 'https://SEU-PROJETO.supabase.co', // Substitua pela sua URL real do Supabase
    anonKey: 'SUA-CHAVE-ANONIMA-REAL' // Substitua pela sua chave anônima real
  },
  
  // Configurações do servidor
  server: {
    port: process.env.PORT || 3001,
    cors: {
      origin: [
        'http://localhost:5173', // Desenvolvimento local
        'http://localhost:3000', // Desenvolvimento local
        'https://SEU-DOMINIO.com', // Seu domínio da VPS
        'https://www.SEU-DOMINIO.com', // Seu domínio com www
        'http://SEU-DOMINIO.com', // HTTP também (será redirecionado para HTTPS)
        'http://www.SEU-DOMINIO.com' // HTTP com www
      ],
      credentials: true
    }
  },
  
  // Configurações específicas para produção
  production: {
    // Logs mais detalhados em produção
    logLevel: 'info',
    
    // Timeout para requisições
    requestTimeout: 30000,
    
    // Rate limiting (opcional)
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100 // máximo 100 requisições por IP por janela
    }
  }
};
