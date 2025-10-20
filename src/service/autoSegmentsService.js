/**
 * 🔄 SERVIÇO DE SEGMENTOS AUTOMÁTICOS
 * Gerencia configuração e controle de segmentos que rodam automaticamente
 */

import { getSupabaseWithSchema } from './supabase.js';
import { supabaseUrl } from '../config/supabase.js';

// ==================== FUNÇÕES DE CONFIGURAÇÃO ====================

export async function getSegmentosAutomaticos() {
  try {
    console.log('🔍 Buscando segmentos automáticos...');
    
    const supabaseClient = getSupabaseWithSchema('api');
    
    // Query simples primeiro (sem JOIN para debug)
    const { data, error } = await supabaseClient
      .from('segmento_automatico')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar segmentos automáticos:', error);
      throw error;
    }

    console.log(`✅ ${data?.length || 0} segmentos automáticos encontrados:`, data);

    // Se não há dados, retornar array vazio
    if (!data) {
      console.log('⚠️ Nenhum dado retornado da query');
      return [];
    }

    // Buscar dados dos segmentos separadamente
    if (data.length > 0) {
      const segmentoIds = data.map(s => s.segmento_id);
      console.log('🔍 Buscando dados dos segmentos:', segmentoIds);
      
      const { data: segmentos, error: segError } = await supabaseClient
        .from('segmento')
        .select('id, name, total_leads, category_title')
        .in('id', segmentoIds);

      if (segError) {
        console.error('⚠️ Erro ao buscar dados dos segmentos:', segError);
      } else {
        console.log('✅ Dados dos segmentos encontrados:', segmentos);
        
        // Combinar dados
        data.forEach(autoSeg => {
          const segData = segmentos?.find(s => s.id === autoSeg.segmento_id);
          if (segData) {
            autoSeg.segmento = segData;
          }
        });
      }
    }

    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar segmentos automáticos:', error);
    throw error;
  }
}

export async function criarSegmentoAutomatico(dados) {
  try {
    console.log('🚀 Criando segmento automático:', dados);
    
    const supabaseClient = getSupabaseWithSchema('api');
    
    // Calcular próxima execução baseada na frequência
    const proximaExecucao = new Date();
    proximaExecucao.setHours(proximaExecucao.getHours() + dados.frequencia_horas);

    const dadosCompletos = {
      ...dados,
      proxima_execucao: proximaExecucao.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseClient
      .from('segmento_automatico')
      .insert(dadosCompletos)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar segmento automático:', error);
      throw error;
    }

    console.log('✅ Segmento automático criado:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao criar segmento automático:', error);
    throw error;
  }
}

export async function atualizarSegmentoAutomatico(id, dados) {
  try {
    console.log('🔄 Atualizando segmento automático:', id, dados);
    
    const supabaseClient = getSupabaseWithSchema('api');
    const { data, error } = await supabaseClient
      .from('segmento_automatico')
      .update({
        ...dados,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar segmento automático:', error);
      throw error;
    }

    console.log('✅ Segmento automático atualizado:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao atualizar segmento automático:', error);
    throw error;
  }
}

export async function deletarSegmentoAutomatico(id) {
  try {
    console.log('🗑️ Deletando segmento automático:', id);
    
    const supabaseClient = getSupabaseWithSchema('api');
    const { error } = await supabaseClient
      .from('segmento_automatico')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erro ao deletar segmento automático:', error);
      throw error;
    }

    console.log('✅ Segmento automático deletado');
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar segmento automático:', error);
    throw error;
  }
}

export async function toggleSegmentoAutomatico(id, ativo) {
  try {
    console.log(`🔄 ${ativo ? 'Ativando' : 'Desativando'} segmento automático:`, id);
    
    return await atualizarSegmentoAutomatico(id, { 
      ativo,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao toggle segmento automático:', error);
    throw error;
  }
}

// ==================== FUNÇÕES DE EXECUÇÃO ====================

export async function executarSegmentoAutomatico(id, onProgress = null) {
  try {
    if (onProgress) onProgress('🚀 Executando segmento automático...');
    
    const response = await fetch('/functions/v1/process-auto-segments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ segmento_id: id })
    });

    const result = await response.json();
    
    if (result.success) {
      if (onProgress) onProgress('✅ Segmento executado com sucesso!');
      return result;
    } else {
      throw new Error(result.error || 'Erro na execução');
    }
  } catch (error) {
    console.error('❌ Erro ao executar segmento automático:', error);
    if (onProgress) onProgress(`❌ Erro: ${error.message}`);
    throw error;
  }
}

export async function executarTodosSegmentosAutomaticos(onProgress = null) {
  try {
    if (onProgress) onProgress('🚀 Executando todos os segmentos automáticos...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/process-auto-segments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('📡 Response text:', responseText);

    if (!responseText) {
      throw new Error('Resposta vazia da Edge Function');
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      throw new Error(`Erro ao processar resposta: ${responseText}`);
    }
    
    if (result.success) {
      if (onProgress) onProgress(`✅ ${result.message}`);
      return result;
    } else {
      throw new Error(result.error || 'Erro na execução');
    }
  } catch (error) {
    console.error('❌ Erro ao executar segmentos automáticos:', error);
    if (onProgress) onProgress(`❌ Erro: ${error.message}`);
    throw error;
  }
}

// ==================== FUNÇÕES DE ESTATÍSTICAS ====================

export async function getEstatisticasSegmentosAutomaticos() {
  try {
    console.log('📊 Buscando estatísticas dos segmentos automáticos...');
    
    const supabaseClient = getSupabaseWithSchema('api');
    
    // Estatísticas gerais
    const { data: stats, error: statsError } = await supabaseClient
      .from('segmento_automatico')
      .select('ativo, total_leads_processados, total_leads_enviados_callix');

    if (statsError) throw statsError;

    // Leads enviados para Callix hoje
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    
    const { data: leadsHoje, error: leadsError } = await supabaseClient
      .from('lead_callix_status')
      .select('id')
      .gte('data_envio_callix', inicioHoje.toISOString());

    if (leadsError) throw leadsError;

    const estatisticas = {
      totalSegmentos: stats.length,
      segmentosAtivos: stats.filter(s => s.ativo).length,
      segmentosInativos: stats.filter(s => !s.ativo).length,
      totalLeadsProcessados: stats.reduce((acc, s) => acc + (s.total_leads_processados || 0), 0),
      totalLeadsEnviadosCallix: stats.reduce((acc, s) => acc + (s.total_leads_enviados_callix || 0), 0),
      leadsEnviadosHoje: leadsHoje.length
    };

    console.log('✅ Estatísticas calculadas:', estatisticas);
    return estatisticas;
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    throw error;
  }
}

export async function getHistoricoExecucoes(limite = 50) {
  try {
    console.log('📋 Buscando histórico de execuções...');
    
    const supabaseClient = getSupabaseWithSchema('api');
    const { data, error } = await supabaseClient
      .from('segmento_automatico')
      .select(`
        id,
        nome,
        ultima_execucao,
        proxima_execucao,
        total_leads_processados,
        total_leads_enviados_callix,
        segmento:segmento_id (
          name
        )
      `)
      .order('ultima_execucao', { ascending: false })
      .limit(limite);

    if (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      throw error;
    }

    console.log(`✅ ${data.length} execuções encontradas no histórico`);
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    throw error;
  }
}

// ==================== FUNÇÕES DE VALIDAÇÃO ====================

export function validarConfiguracaoSegmento(dados) {
  const erros = [];

  if (!dados.segmento_id) {
    erros.push('ID do segmento é obrigatório');
  }

  if (!dados.nome || dados.nome.trim().length < 3) {
    erros.push('Nome deve ter pelo menos 3 caracteres');
  }

  if (!dados.frequencia_horas || dados.frequencia_horas < 1 || dados.frequencia_horas > 168) {
    erros.push('Frequência deve ser entre 1 e 168 horas (1 semana)');
  }

  if (typeof dados.enviar_callix !== 'boolean') {
    erros.push('Configuração de envio para Callix é obrigatória');
  }

  return {
    valido: erros.length === 0,
    erros
  };
}

export function calcularProximaExecucao(frequenciaHoras) {
  const proxima = new Date();
  proxima.setHours(proxima.getHours() + frequenciaHoras);
  return proxima;
}

export function formatarTempoRestante(proximaExecucao) {
  const agora = new Date();
  const proxima = new Date(proximaExecucao);
  const diffMs = proxima.getTime() - agora.getTime();
  
  if (diffMs <= 0) {
    return 'Pronto para execução';
  }

  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHoras > 0) {
    return `Em ${diffHoras}h ${diffMinutos}m`;
  } else {
    return `Em ${diffMinutos} minutos`;
  }
}
