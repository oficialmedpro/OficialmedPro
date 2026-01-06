// ⚙️ CONFIGURAÇÃO DA PÁGINA DE PRÉ-CHECKOUT
// 
// Copie este arquivo para config.js e edite com suas configurações

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
    BASE_URL: 'https://pedido.oficialmed.com.br'
};

// Tornar disponível globalmente
window.CONFIG = CONFIG;
