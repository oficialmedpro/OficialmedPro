// ⚙️ CONFIGURAÇÃO DA PÁGINA DE PRÉ-CHECKOUT
// 
// Edite este arquivo com suas configurações antes de publicar

const CONFIG = {
    // URL do Supabase
    SUPABASE_URL: 'https://agdffspstbxeqhqtltvb.supabase.co',
    
    // Chave pública (anon) do Supabase
    // ⚠️ IMPORTANTE: Use apenas a chave pública (anon), nunca a service_role
    // Você pode encontrar em: Supabase Dashboard > Settings > API > anon public
    SUPABASE_KEY: 'COLE_SUA_CHAVE_ANON_AQUI',
    
    // Schema do banco (geralmente 'api' ou 'public')
    SUPABASE_SCHEMA: 'api',
    
    // URL da API para finalizar checkout
    // Ajuste para a URL da sua API que gera o checkout final
    API_URL: 'https://api.oficialmed.com.br',
    
    // URL base do pré-checkout (para construir URLs)
    BASE_URL: 'https://pedido.oficialmed.com.br',
    
    // URL do webhook do n8n para gerar checkout
    // Ajuste para a URL do seu n8n: https://seu-n8n.com/webhook-pagina-precheckout
    N8N_WEBHOOK_URL: 'https://seu-n8n.com/webhook-pagina-precheckout',
    
    // Google Analytics 4 - Measurement ID
    // Obtenha em: https://analytics.google.com → Admin → Data Streams
    // Formato: G-XXXXXXXXXX
    GA4_MEASUREMENT_ID: 'G-NCJG7F37CL',
    
    // Facebook Pixel ID (opcional)
    // Obtenha em: https://business.facebook.com → Events Manager
    FACEBOOK_PIXEL_ID: null,
    
    // API do Checkout Transparente (Asaas)
    // URL base da API do backend que integra com Asaas
    CHECKOUT_API_URL: 'http://localhost:3001',
    
    // API Key do backend (para autenticação)
    // ⚠️ IMPORTANTE: Esta chave deve ser configurada no backend
    // Configure no arquivo .env do backend ou variável de ambiente
    CHECKOUT_API_KEY: 'sua_chave_api_backend'
};

// Tornar disponível globalmente
window.CONFIG = CONFIG;
