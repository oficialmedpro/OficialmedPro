/**
 * 🔧 SUPABASE CLIENTE ESPECÍFICO PARA DASHBOARD DE VENDAS
 * 
 * Este arquivo contém APENAS o necessário para a dashboard de vendas
 * SEM dependências do Google Ads ou outros serviços desnecessários
 */

import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseServiceKey, supabaseSchema } from '../config/supabase.js';

// Função para limpar e validar URL
const cleanAndValidateUrl = (url) => {
  // Se não tiver URL ou não for string, usar fallback
  if (!url || typeof url !== 'string') {
    console.warn('⚠️ [supabase-vendas.js] URL não fornecida, usando fallback');
    return 'https://agdffspstbxeqhqtltvb.supabase.co';
  }

  // Limpar espaços, quebras de linha e caracteres invisíveis
  let cleanUrl = url.trim().replace(/[\r\n\t]/g, '');

  // Verificar se começa com http
  if (!cleanUrl.startsWith('http')) {
    console.error('❌ [supabase-vendas.js] URL não começa com http:', cleanUrl);
    return 'https://agdffspstbxeqhqtltvb.supabase.co';
  }

  // Tentar criar URL para validar formato
  try {
    new URL(cleanUrl);
    console.log('✅ [supabase-vendas.js] URL válida:', cleanUrl.substring(0, 30) + '...');
    return cleanUrl;
  } catch (e) {
    console.error('❌ [supabase-vendas.js] Erro ao validar URL:', e.message);
    console.error('❌ [supabase-vendas.js] URL recebida:', cleanUrl);
    return 'https://agdffspstbxeqhqtltvb.supabase.co';
  }
};

// Validar e limpar URLs antes de criar cliente
let validSupabaseUrl = cleanAndValidateUrl(supabaseUrl);
let validSupabaseServiceKey = supabaseServiceKey;

// Cliente Supabase com service role key (permite acesso a todos os schemas)
let supabase;
try {
  supabase = createClient(validSupabaseUrl, validSupabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: supabaseSchema || 'api'
    },
    global: {
      headers: {
        'Accept-Profile': supabaseSchema || 'api',
        'Content-Profile': supabaseSchema || 'api'
      }
    }
  });
} catch (error) {
  console.error('❌ [supabase-vendas.js] Erro ao criar cliente Supabase:', error);
  console.error('❌ [supabase-vendas.js] URL usada:', validSupabaseUrl);
  console.error('❌ [supabase-vendas.js] Service Key presente:', !!validSupabaseServiceKey);
  // Fallback client
  supabase = createClient('https://agdffspstbxeqhqtltvb.supabase.co', validSupabaseServiceKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA', {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'api' },
    global: { headers: { 'Accept-Profile': 'api', 'Content-Profile': 'api' } }
  });
}

// Função para obter o cliente com schema específico
// Cache de clientes Supabase para evitar múltiplas instâncias
const supabaseClients = new Map();

export const getSupabaseWithSchema = (schema) => {
  const schemaKey = schema || 'api';
  
  // Verificar se já existe um cliente para este schema
  if (supabaseClients.has(schemaKey)) {
    return supabaseClients.get(schemaKey);
  }
  
  // Criar novo cliente
  let client;
  try {
    client = createClient(validSupabaseUrl, validSupabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: schemaKey
      },
      global: {
        headers: {
          'Accept-Profile': schemaKey,
          'Content-Profile': schemaKey
        }
      }
    });
  } catch (error) {
    console.error('❌ [supabase-vendas.js] Erro ao criar cliente com schema:', error);
    // Fallback client
    client = createClient('https://agdffspstbxeqhqtltvb.supabase.co', validSupabaseServiceKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA', {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: schemaKey },
      global: { headers: { 'Accept-Profile': schemaKey, 'Content-Profile': schemaKey } }
    });
  }
  
  // Armazenar no cache
  supabaseClients.set(schemaKey, client);
  return client;
};

// Exportar cliente principal
export { supabase };

// Exportar configurações
export { supabaseUrl, supabaseServiceKey, supabaseSchema };




