/**
 * 🎯 DAILY PERFORMANCE VERTICAL SERVICE
 * 
 * Service para buscar dados das rondas da tabela api.rondas
 * e estruturar para o componente vertical
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

/**
 * Buscar dados das rondas da tabela api.rondas
 */
export const getRondasData = async () => {
  try {
    console.log('📊 Buscando dados das rondas...');

    const response = await fetch(`${supabaseUrl}/rest/v1/rondas?select=nome&order=nome.asc`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar rondas: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Dados das rondas carregados:', data);

    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar dados das rondas:', error);

    // SEM fallback - retornar array vazio
    return [];
  }
};

/**
 * Buscar dados de performance vertical (placeholder para futuras implementações)
 */
export const getDailyPerformanceVerticalData = async (params) => {
  try {
    console.log('📊 Buscando dados de performance vertical...', params);
    
    // SEM dados mockup - função não implementada
    throw new Error('Função getDailyPerformanceVerticalData não implementada - use getPerformanceDataByRondaHorario');
  } catch (error) {
    console.error('❌ Erro ao buscar dados de performance vertical:', error);
    throw error;
  }
};









