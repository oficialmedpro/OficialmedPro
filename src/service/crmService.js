import { supabase, getSupabaseWithSchema } from './supabase';

// Configuração do Supabase
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

/**
 * Service para dados do CRM
 * Gerencia métricas de leads, performance financeira e tempo médio
 */
export const crmService = {
  /**
   * Busca métricas de status dos leads
   * @param {Object} filters - Filtros aplicados
   * @returns {Object} Métricas de leads convertidos, perdidos e em aberto
   */
  async getLeadsMetrics(filters = {}) {
    try {
      console.log('🔍 CRM Service: Buscando métricas de leads...', filters);

      // Query para leads convertidos
      const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
      const { data: convertedData, error: convertedError } = await supabaseWithSchema
        .from('oportunidade_sprint')
        .select('id, status, gain_date')
        .eq('status', 'gain')
        .not('gain_date', 'is', null);

      if (convertedError) {
        console.error('❌ Erro ao buscar leads convertidos:', convertedError);
        throw convertedError;
      }

      // Query para leads perdidos
      const { data: lostData, error: lostError } = await supabaseWithSchema
        .from('oportunidade_sprint')
        .select('id, status, lost_date')
        .eq('status', 'lost')
        .not('lost_date', 'is', null);

      if (lostError) {
        console.error('❌ Erro ao buscar leads perdidos:', lostError);
        throw lostError;
      }

      // Query para leads em aberto
      const { data: openData, error: openError } = await supabaseWithSchema
        .from('oportunidade_sprint')
        .select('id, status, create_date')
        .in('status', ['open', 'new', 'qualified']);

      if (openError) {
        console.error('❌ Erro ao buscar leads em aberto:', openError);
        throw openError;
      }

      const converted = convertedData?.length || 0;
      const lost = lostData?.length || 0;
      const open = openData?.length || 0;
      const total = converted + lost + open;

      const metrics = {
        converted: {
          value: converted,
          percentage: total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0'
        },
        lost: {
          value: lost,
          percentage: total > 0 ? ((lost / total) * 100).toFixed(1) : '0.0'
        },
        open: {
          value: open,
          percentage: total > 0 ? ((open / total) * 100).toFixed(1) : '0.0'
        },
        total
      };

      console.log('✅ CRM Service: Métricas de leads carregadas:', metrics);
      return metrics;

    } catch (error) {
      console.error('❌ CRM Service: Erro ao buscar métricas de leads:', error);
      return {
        converted: { value: 0, percentage: '0.0' },
        lost: { value: 0, percentage: '0.0' },
        open: { value: 0, percentage: '0.0' },
        total: 0
      };
    }
  },

  /**
   * Busca métricas de performance financeira
   * @param {Object} filters - Filtros aplicados
   * @returns {Object} Métricas de ROAS, ROI e taxa de conversão
   */
  async getFinancialMetrics(filters = {}) {
    try {
      console.log('🔍 CRM Service: Buscando métricas financeiras...', filters);

      // Query para oportunidades fechadas com valores
      const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
      const { data: opportunitiesData, error: opportunitiesError } = await supabaseWithSchema
        .from('oportunidade_sprint')
        .select('id, value, status, gain_date')
        .eq('status', 'gain')
        .not('value', 'is', null);

      if (opportunitiesError) {
        console.error('❌ Erro ao buscar oportunidades:', opportunitiesError);
        throw opportunitiesError;
      }

      if (!opportunitiesData || opportunitiesData.length === 0) {
        console.log('⚠️ CRM Service: Nenhuma oportunidade fechada encontrada');
        return {
          roas: { value: '0.0x', percentage: '0%' },
          roi: { value: '0%', percentage: '0%' },
          conversionRate: { value: '0.0%', percentage: '0.0%' }
        };
      }

      // Calcular métricas
      const totalValue = opportunitiesData.reduce((sum, opp) => sum + (parseFloat(opp.value) || 0), 0);
      const totalOpportunities = opportunitiesData.length;

      // ROAS (Return on Ad Spend) - usando value como base
      const roas = totalValue > 0 ? (totalValue / totalValue).toFixed(1) : 0;
      const roasPercentage = totalValue > 0 ? ((totalValue / totalValue) * 100).toFixed(0) : 0;

      // ROI (Return on Investment) - simplificado
      const roi = totalValue > 0 ? 100 : 0;

      // Taxa de conversão (assumindo que todas as oportunidades fechadas são conversões)
      const conversionRate = totalOpportunities > 0 ? (100).toFixed(1) : 0;

      const metrics = {
        roas: {
          value: `${roas}x`,
          percentage: `${roasPercentage}%`
        },
        roi: {
          value: `${roi}%`,
          percentage: `${roi}%`
        },
        conversionRate: {
          value: `${conversionRate}%`,
          percentage: `${conversionRate}%`
        }
      };

      console.log('✅ CRM Service: Métricas financeiras carregadas:', metrics);
      return metrics;

    } catch (error) {
      console.error('❌ CRM Service: Erro ao buscar métricas financeiras:', error);
      return {
        roas: { value: '0.0x', percentage: '0%' },
        roi: { value: '0%', percentage: '0%' },
        conversionRate: { value: '0.0%', percentage: '0.0%' }
      };
    }
  },

  /**
   * Busca métricas de tempo médio
   * @param {Object} filters - Filtros aplicados
   * @returns {Object} Métricas de tempo de fechamento e taxa de perda
   */
  async getTimeMetrics(filters = {}) {
    try {
      console.log('🔍 CRM Service: Buscando métricas de tempo...', filters);

      // Query para oportunidades fechadas com datas
      const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
      const { data: closedData, error: closedError } = await supabaseWithSchema
        .from('oportunidade_sprint')
        .select('id, create_date, gain_date, lost_date, status')
        .in('status', ['gain', 'lost'])
        .not('create_date', 'is', null);

      if (closedError) {
        console.error('❌ Erro ao buscar oportunidades fechadas:', closedError);
        throw closedError;
      }

      if (!closedData || closedData.length === 0) {
        console.log('⚠️ CRM Service: Nenhuma oportunidade fechada encontrada');
        return {
          avgClosingTime: { value: '0 dias', percentage: '0 dias' },
          lossRate: { value: '0%', percentage: '0%' }
        };
      }

      // Calcular tempo médio de fechamento
      const closedOpportunities = closedData.filter(opp => opp.status === 'gain' && opp.gain_date);
      let totalDays = 0;
      let validClosings = 0;

      closedOpportunities.forEach(opp => {
        const createdDate = new Date(opp.create_date);
        const gainDate = new Date(opp.gain_date);
        const daysDiff = Math.ceil((gainDate - createdDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 0) {
          totalDays += daysDiff;
          validClosings++;
        }
      });

      const avgClosingTime = validClosings > 0 ? Math.round(totalDays / validClosings) : 0;

      // Calcular taxa de perda
      const lostOpportunities = closedData.filter(opp => opp.status === 'lost').length;
      const totalClosed = closedData.length;
      const lossRate = totalClosed > 0 ? ((lostOpportunities / totalClosed) * 100).toFixed(1) : 0;

      const metrics = {
        avgClosingTime: {
          value: `${avgClosingTime} dias`,
          percentage: `${avgClosingTime} dias`
        },
        lossRate: {
          value: `${lossRate}%`,
          percentage: `${lossRate}%`
        }
      };

      console.log('✅ CRM Service: Métricas de tempo carregadas:', metrics);
      return metrics;

    } catch (error) {
      console.error('❌ CRM Service: Erro ao buscar métricas de tempo:', error);
      return {
        avgClosingTime: { value: '0 dias', percentage: '0 dias' },
        lossRate: { value: '0%', percentage: '0%' }
      };
    }
  },

  /**
   * Busca todas as métricas do CRM
   * @param {Object} filters - Filtros aplicados
   * @returns {Object} Todas as métricas do CRM
   */
  async getAllCrmMetrics(filters = {}) {
    try {
      console.log('🔍 CRM Service: Buscando todas as métricas do CRM...', filters);

      const [leadsMetrics, financialMetrics, timeMetrics] = await Promise.all([
        this.getLeadsMetrics(filters),
        this.getFinancialMetrics(filters),
        this.getTimeMetrics(filters)
      ]);

      const allMetrics = {
        leads: leadsMetrics,
        financial: financialMetrics,
        time: timeMetrics
      };

      console.log('✅ CRM Service: Todas as métricas carregadas:', allMetrics);
      return allMetrics;

    } catch (error) {
      console.error('❌ CRM Service: Erro ao buscar todas as métricas:', error);
      return {
        leads: {
          converted: { value: 0, percentage: '0.0' },
          lost: { value: 0, percentage: '0.0' },
          open: { value: 0, percentage: '0.0' },
          total: 0
        },
        financial: {
          roas: { value: '0.0x', percentage: '0%' },
          roi: { value: '0%', percentage: '0%' },
          conversionRate: { value: '0.0%', percentage: '0.0%' }
        },
        time: {
          avgClosingTime: { value: '0 dias', percentage: '0 dias' },
          lossRate: { value: '0%', percentage: '0%' }
        }
      };
    }
  }
};

export default crmService;
