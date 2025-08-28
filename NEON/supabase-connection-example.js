/**
 * 🔗 EXEMPLO DE CONEXÃO COM SUPABASE
 * Usando as variáveis de ambiente do arquivo supabase.env
 */

// 📦 INSTALAR: npm install @supabase/supabase-js dotenv

// 🔧 CONFIGURAÇÃO
require('dotenv').config({ path: './supabase.env' });

const { createClient } = require('@supabase/supabase-js');

// 🚀 CRIAR CLIENTE SUPABASE
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 📊 EXEMPLO DE CONSULTA NO SCHEMA API
async function exemploConsulta() {
    try {
        console.log('🔍 Conectando ao Supabase...');
        console.log(`📍 URL: ${process.env.SUPABASE_URL}`);
        console.log(`📊 Schema: ${process.env.SUPABASE_SCHEMA}`);
        
        // Exemplo: consultar tabela no schema api
        const { data, error } = await supabase
            .from('oportunidade_sprint')
            .select('*')
            .limit(5);
        
        if (error) {
            console.error('❌ Erro na consulta:', error);
            return;
        }
        
        console.log('✅ Dados recuperados:', data);
        
    } catch (error) {
        console.error('💥 Erro geral:', error);
    }
}

// 🧪 EXECUTAR EXEMPLO
exemploConsulta();

// 📋 OUTRAS FORMAS DE USAR:

// 1. Via fetch HTTP direto
async function exemploFetch() {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/oportunidade_sprint`, {
        headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json'
        }
    });
    
    const data = await response.json();
    console.log('📡 Dados via fetch:', data);
}

// 2. Configuração para outros projetos
const config = {
    supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_SERVICE_ROLE_KEY,
        schema: process.env.SUPABASE_SCHEMA
    },
    sprinthub: {
        baseUrl: process.env.SPRINTHUB_BASE_URL,
        instance: process.env.SPRINTHUB_INSTANCE,
        token: process.env.SPRINTHUB_API_TOKEN
    }
};

console.log('⚙️ Configuração completa:', config);

