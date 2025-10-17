import { getSupabaseWithSchema } from './supabase.js';

class SegmentoService {
  constructor() {
    this.supabaseClient = getSupabaseWithSchema('api');
  }

  /**
   * Executa um segmento automaticamente
   * @param {number} segmentoId - ID do segmento
   * @param {boolean} executarAgora - Se deve executar imediatamente
   * @returns {Promise<Object>} Resultado da execução
   */
  async executarSegmento(segmentoId, executarAgora = false) {
    try {
      const startTime = Date.now();
      
      // 1. Buscar dados do segmento
      const { data: segmento, error: segmentoError } = await this.supabaseClient
        .from('segmento_automatico')
        .select('*')
        .eq('id', segmentoId)
        .single();

      if (segmentoError || !segmento) {
        throw new Error('Segmento não encontrado');
      }

      if (!segmento.ativo) {
        throw new Error('Segmento está inativo');
      }

      // 2. Criar log de execução
      const { data: logData, error: logError } = await this.supabaseClient
        .from('segmento_execucao_log')
        .insert({
          segmento_id: segmentoId,
          status: 'running',
          message: `Iniciando execução do segmento ${segmento.nome}`,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (logError) {
        console.error('Erro ao criar log:', logError);
      }

      // 3. Buscar leads do segmento
      const leads = await this.buscarLeadsSegmento(segmento);
      
      if (leads.length === 0) {
        await this.atualizarLogExecucao(logData.id, 'success', 'Nenhum lead encontrado para o segmento', 0, 0);
        return {
          success: true,
          leads_processados: 0,
          enviados_callix: 0,
          tempo_execucao: Math.round((Date.now() - startTime) / 1000)
        };
      }

      // 4. Processar leads
      let enviadosCallix = 0;
      
      if (segmento.enviar_callix && segmento.lista_callix_id) {
        enviadosCallix = await this.enviarParaCallix(leads, segmento.lista_callix_id);
      }

      // 5. Atualizar estatísticas do segmento
      await this.atualizarEstatisticasSegmento(segmentoId, leads.length, enviadosCallix);

      // 6. Atualizar log de execução
      const tempoExecucao = Math.round((Date.now() - startTime) / 1000);
      await this.atualizarLogExecucao(
        logData.id, 
        'success', 
        `Processados ${leads.length} leads, ${enviadosCallix} enviados para Callix`,
        leads.length,
        enviadosCallix
      );

      return {
        success: true,
        leads_processados: leads.length,
        enviados_callix: enviadosCallix,
        tempo_execucao: tempoExecucao
      };

    } catch (error) {
      console.error('Erro ao executar segmento:', error);
      
      // Atualizar log com erro
      if (logData?.id) {
        await this.atualizarLogExecucao(logData.id, 'error', error.message, 0, 0);
      }

      throw error;
    }
  }

  /**
   * Busca leads do segmento baseado nos critérios
   * @param {Object} segmento - Dados do segmento
   * @returns {Promise<Array>} Lista de leads
   */
  async buscarLeadsSegmento(segmento) {
    try {
      // Aqui você implementaria a lógica específica para buscar leads
      // baseado nos critérios do segmento (RFV, data, etc.)
      
      // Por enquanto, vou simular uma busca básica
      const { data: leads, error } = await this.supabaseClient
        .from('leads')
        .select('id, firstname, lastname, phone, email, whatsapp')
        .eq('archived', false)
        .limit(100); // Limite para teste

      if (error) {
        throw new Error(`Erro ao buscar leads: ${error.message}`);
      }

      return leads || [];
    } catch (error) {
      console.error('Erro ao buscar leads do segmento:', error);
      throw error;
    }
  }

  /**
   * Envia leads para o Callix
   * @param {Array} leads - Lista de leads
   * @param {number} listaId - ID da lista no Callix
   * @returns {Promise<number>} Número de leads enviados
   */
  async enviarParaCallix(leads, listaId) {
    try {
      // Preparar dados para o Callix
      const importData = leads.map(lead => ({
        nome: `${lead.firstname || ''} ${lead.lastname || ''}`.trim() || 'Lead sem nome',
        telefone: lead.phone || lead.whatsapp || lead.mobile || ''
      })).filter(lead => lead.telefone); // Apenas leads com telefone

      if (importData.length === 0) {
        return 0;
      }

      // Enviar para Callix
      const callixResponse = await fetch('https://oficialmed.callix.com.br/api/v1/campaign_contacts_async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          'Authorization': `Bearer ${import.meta.env.VITE_CALLIX_API_TOKEN || ''}`
        },
        body: JSON.stringify({
          data: {
            type: "campaign_contacts_async",
            attributes: {
              remove_duplicated_phones: "true",
              import_data: importData
            },
            relationships: {
              campaign_list: {
                data: {
                  type: "campaign_lists",
                  id: listaId
                }
              }
            }
          }
        })
      });

      if (!callixResponse.ok) {
        throw new Error(`Erro ao enviar para Callix: ${callixResponse.status}`);
      }

      const result = await callixResponse.json();
      return importData.length; // Retorna quantidade enviada

    } catch (error) {
      console.error('Erro ao enviar para Callix:', error);
      return 0; // Retorna 0 em caso de erro
    }
  }

  /**
   * Atualiza estatísticas do segmento
   * @param {number} segmentoId - ID do segmento
   * @param {number} leadsProcessados - Número de leads processados
   * @param {number} enviadosCallix - Número de leads enviados para Callix
   */
  async atualizarEstatisticasSegmento(segmentoId, leadsProcessados, enviadosCallix) {
    try {
      await this.supabaseClient
        .from('segmento_automatico')
        .update({
          total_leads: leadsProcessados,
          enviados_callix: enviadosCallix,
          ultima_execucao: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', segmentoId);
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  }

  /**
   * Atualiza log de execução
   * @param {number} logId - ID do log
   * @param {string} status - Status da execução
   * @param {string} message - Mensagem
   * @param {number} leadsProcessados - Leads processados
   * @param {number} enviadosCallix - Enviados para Callix
   */
  async atualizarLogExecucao(logId, status, message, leadsProcessados, enviadosCallix) {
    try {
      await this.supabaseClient
        .from('segmento_execucao_log')
        .update({
          status,
          message,
          leads_processados: leadsProcessados,
          enviados_callix: enviadosCallix,
          finished_at: new Date().toISOString(),
          duration_seconds: Math.round((Date.now() - new Date().getTime()) / 1000)
        })
        .eq('id', logId);
    } catch (error) {
      console.error('Erro ao atualizar log:', error);
    }
  }

  /**
   * Lista todos os segmentos
   * @returns {Promise<Array>} Lista de segmentos
   */
  async listarSegmentos() {
    try {
      const { data, error } = await this.supabaseClient
        .from('segmento_automatico')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao listar segmentos: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao listar segmentos:', error);
      throw error;
    }
  }

  /**
   * Cria um novo segmento
   * @param {Object} dadosSegmento - Dados do segmento
   * @returns {Promise<Object>} Segmento criado
   */
  async criarSegmento(dadosSegmento) {
    try {
      const { data, error } = await this.supabaseClient
        .from('segmento_automatico')
        .insert({
          ...dadosSegmento,
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar segmento: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar segmento:', error);
      throw error;
    }
  }

  /**
   * Executa todos os segmentos ativos
   * @returns {Promise<Object>} Resultado da execução
   */
  async executarTodosSegmentos() {
    try {
      const segmentos = await this.listarSegmentos();
      const segmentosAtivos = segmentos.filter(s => s.ativo);
      
      const resultados = [];
      
      for (const segmento of segmentosAtivos) {
        try {
          const resultado = await this.executarSegmento(segmento.id, true);
          resultados.push({
            segmento_id: segmento.id,
            segmento_nome: segmento.nome,
            success: true,
            ...resultado
          });
        } catch (error) {
          resultados.push({
            segmento_id: segmento.id,
            segmento_nome: segmento.nome,
            success: false,
            error: error.message
          });
        }
      }

      return {
        success: true,
        total_segmentos: segmentosAtivos.length,
        executados_com_sucesso: resultados.filter(r => r.success).length,
        resultados
      };
    } catch (error) {
      console.error('Erro ao executar todos os segmentos:', error);
      throw error;
    }
  }
}

export const segmentoService = new SegmentoService();
export default segmentoService;

