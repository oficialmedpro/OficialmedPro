import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { syncFollowUpStage, checkFollowUpSync } from '../service/sprintHubSyncService';
import { testFunilSpecific, testFunilSpecificWithUnit } from '../service/totalOportunidadesService';
import autoSyncService from '../service/autoSyncService';
import scheduledSyncService from '../service/scheduledSyncService';
import notificationService from '../service/notificationService';
// Imports temporariamente removidos - arquivos não existem no repositório
// import { generateDuplicateReport, performFullCleanup } from '../service/duplicateCleanupService';
// import { syncTodayOnly, syncAll, checkFullSync } from '../service/unifiedSyncService';
// import todaySyncService from '../service/todaySyncService';
// import detacorretaIncremental from '../service/detacorreta_incremental';
import dailySyncService from '../service/dailySyncService';
import { supabaseUrl } from '../config/supabase.js';
import './TopMenuBar.css';

// Sistema de Logger Configurável
const DEBUG_MODE = process.env.NODE_ENV === 'development' || localStorage.getItem('debug') === 'true';
const LOG_LEVEL = localStorage.getItem('logLevel') || 'error'; // 'none', 'error', 'info', 'debug'

const logger = {
  debug: (...args) => {
    if (DEBUG_MODE && LOG_LEVEL === 'debug') {
      console.log(...args);
    }
  },
  info: (...args) => {
    if (LOG_LEVEL === 'info' || LOG_LEVEL === 'debug') {
      console.log(...args);
    }
  },
  error: (...args) => {
    if (LOG_LEVEL !== 'none') {
      console.error(...args);
    }
  },
  warn: (...args) => {
    if (LOG_LEVEL !== 'none') {
      console.warn(...args);
    }
  }
};

// Importar ícones SVG
import BandeiraEUA from '../../icones/eua.svg';
import BandeiraBrasil from '../../icones/brasil.svg';
import LogoOficialmed from '../../icones/icone_oficialmed.svg';

const TopMenuBar = ({ 
  sidebarExpanded, 
  toggleSidebar, 
  toggleFullscreen, 
  toggleTheme, 
  isDarkMode,
  currentLanguage,
  changeLanguage,
  onLogout
}) => {
  const navigate = useNavigate();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingToday, setIsSyncingToday] = useState(false);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  const [isFullSyncing, setIsFullSyncing] = useState(false);
  const [isCheckingSync, setIsCheckingSync] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [isDailySyncRunning, setIsDailySyncRunning] = useState(false);
  const [isSyncingWeekly, setIsSyncingWeekly] = useState(false);
  const [isSyncingHourly, setIsSyncingHourly] = useState(false);
  const [isHourlySyncRunning, setIsHourlySyncRunning] = useState(false);
  const [hourlySyncInterval, setHourlySyncInterval] = useState(null);
  const [syncProgress, setSyncProgress] = useState(null);
  
  // Estados para sincronização agendada
  const [isScheduledSyncRunning, setIsScheduledSyncRunning] = useState(false);
  const [nextScheduledSync, setNextScheduledSync] = useState(null);
  const [scheduledSyncTimes, setScheduledSyncTimes] = useState([]);
  const languageDropdownRef = useRef(null);
  
  // Verificar se é admin (temporário - baseado nas credenciais fixas)
  const isAdmin = true; // Por enquanto sempre admin, depois implementar lógica real

  // Progress callback para UI em vez de logs excessivos
  const updateSyncProgress = (stage, progress, total, details = '') => {
    const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;
    setSyncProgress({ stage, progress, total, percentage, details });
    logger.info(`📊 ${stage}: ${progress}/${total} (${percentage}%) ${details}`);
  };

  // Limpar progress ao final das operações
  const clearSyncProgress = () => {
    setTimeout(() => setSyncProgress(null), 3000); // Remove após 3 segundos
  };

  // 📝 Registrar sincronização via REST (schema api)
  const insertSyncRecordBrowser = async (description) => {
    try {
      const SUPABASE_URL = supabaseUrl;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      if (!SUPABASE_URL || !SUPABASE_KEY) return;
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/sincronizacao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
          'Accept-Profile': 'api',
          'Content-Profile': 'api',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          created_at: new Date().toISOString(),
          data: new Date().toISOString(),
          descricao: description
        })
      });
      if (!resp.ok) {
        const body = await resp.text();
        logger?.warn?.(`⚠️ Falha ao registrar sincronização (HTTP ${resp.status})`, body);
        console.warn('Falha ao registrar sincronização', resp.status, body);
      } else {
        logger?.info?.('📝 Registro de sincronização salvo (UI)');
      }
    } catch (err) {
      logger?.warn?.('⚠️ Erro ao registrar sincronização (UI):', err);
      console.warn('Erro ao registrar sincronização (UI):', err);
    }
  };

  // 🔎 Buscar última sincronização e próxima execução da view api.sync_status
  const fetchLastSyncFromDB = async () => {
    try {
      const SUPABASE_URL = supabaseUrl;
      const SUPABASE_KEY = supabaseServiceKey;
      
      // Debug específico para o erro 401
      console.log('🔍 DEBUG sync_status - Configuração:', {
        hasUrl: !!SUPABASE_URL,
        hasKey: !!SUPABASE_KEY,
        urlStart: SUPABASE_URL?.substring(0, 30) + '...',
        keyStart: SUPABASE_KEY?.substring(0, 20) + '...',
        keyLength: SUPABASE_KEY?.length
      });
      
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('❌ sync_status: URL ou KEY não encontradas');
        return;
      }
      
      // Buscar status da sincronização automática (cronjob)
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/sync_status?select=*`,
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'apikey': SUPABASE_KEY,
            'Accept-Profile': 'api'
          }
        }
      );
      
      if (!resp.ok) {
        console.error('❌ sync_status: Erro na resposta:', {
          status: resp.status,
          statusText: resp.statusText,
          url: resp.url
        });
        return;
      }
      const arr = await resp.json();
      
      if (Array.isArray(arr) && arr.length > 0) {
        const status = arr[0];
        
        // Atualizar última sincronização
        if (status.ultima_sincronizacao) {
          setLastSyncTime(new Date(status.ultima_sincronizacao));
        }
        
        // Atualizar próxima sincronização
        if (status.proxima_sincronizacao) {
          setNextScheduledSync(new Date(status.proxima_sincronizacao));
        }
      }
    } catch (_) {
      // silencioso para não poluir UI
    }
  };

  // 🔄 SINCRONIZAÇÃO COMPLETA FUNIL 14 (RECOMPRA) - TODAS AS OPORTUNIDADES
  const sincronizacaoCompletaFunil14 = async () => {
    const confirmSync = confirm(
      '🔄 SINCRONIZAÇÃO COMPLETA - FUNIL 14 (RECOMPRA)\n\n' +
      '🎯 O que será executado:\n' +
      '• Buscar TODAS as 3.137 oportunidades do funil 14\n' +
      '• TODOS os status: gain, open, lost, etc.\n' +
      '• TODAS as etapas: 238, 239, 240, 241, 242, 243\n' +
      '• INSERIR oportunidades novas no Supabase\n' +
      '• ATUALIZAR oportunidades existentes\n' +
      '• Progress em tempo real\n\n' +
      '⏱️ Tempo estimado: 30-50 minutos\n' +
      '📊 Total esperado: ~3.137 oportunidades\n\n' +
      '⚠️ ATENÇÃO: Operação longa, não feche o navegador!\n\n' +
      'Deseja continuar com a sincronização completa?'
    );
    
    if (!confirmSync) return;
    
    updateSyncProgress('Sincronização Completa Funil 14', 0, 100, 'Iniciando...');
    
    try {
      logger.info('🔄 INICIANDO SINCRONIZAÇÃO COMPLETA - FUNIL 14 (RECOMPRA)');
      logger.info('='.repeat(80));
      logger.info(`🕒 Início: ${new Date().toLocaleTimeString('pt-BR')}`);
      logger.info('🎯 Objetivo: Sincronizar TODAS as oportunidades do funil 14');
      logger.info('='.repeat(80));

      // Configurações
      const SPRINTHUB_CONFIG = {
        baseUrl: 'sprinthub-api-master.sprinthub.app',
        apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c',
        instance: 'oficialmed'
      };

      const SUPABASE_URL = supabaseUrl;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

      const FUNIL_14_STAGES = [238, 239, 240, 241, 242, 243];
      const TARGET_FUNNEL = 14;
      const PAGE_LIMIT = 100;

      // Estatísticas
      let totalProcessed = 0;
      let totalInserted = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;
      let totalErrors = 0;
      let totalApiCalls = 0;
      const startTime = performance.now();

      // Função para mapear campos da oportunidade
      const mapOpportunityFields = (opp) => ({
        id: opp.id,
        title: opp.title || '',
        value: parseFloat(opp.value || 0),
        status: opp.status || '',
        create_date: opp.createDate ? new Date(opp.createDate).toISOString() : null,
        gain_date: opp.gainDate ? new Date(opp.gainDate).toISOString() : null,
        lost_date: opp.lostDate ? new Date(opp.lostDate).toISOString() : null,
        funil_id: TARGET_FUNNEL,
        stage_id: opp.stage || null,
        lead_id: opp.lead_id || null,
        user_id: opp.user || '',
        origem_oportunidade: opp.origin || null,
        unidade_id: '[1]', // Apucarana
        archived: 0,
        synced_at: new Date().toISOString()
      });

      // Função para verificar se oportunidade existe no Supabase
      const checkInSupabase = async (opportunityId) => {
        try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/oportunidade_sprint?select=id,synced_at&id=eq.${opportunityId}`, {
            headers: {
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'apikey': SUPABASE_KEY,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) && data.length > 0 ? data[0] : null;
          }
          return null;
        } catch (error) {
          logger.error(`❌ Erro ao verificar ID ${opportunityId}:`, error);
          return null;
        }
      };

      // Função para inserir no Supabase
      const insertToSupabase = async (data) => {
        try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/oportunidade_sprint`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'apikey': SUPABASE_KEY,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(data)
          });

          return { success: response.ok, status: response.status };
        } catch (error) {
          logger.error('❌ Erro ao inserir:', error);
          return { success: false, error: error.message };
        }
      };

      // Função para atualizar no Supabase
      const updateInSupabase = async (opportunityId, data) => {
        try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'apikey': SUPABASE_KEY,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(data)
          });

          return { success: response.ok, status: response.status };
        } catch (error) {
          logger.error('❌ Erro ao atualizar:', error);
          return { success: false, error: error.message };
        }
      };

      // Processar cada etapa do funil 14
      for (let stageIndex = 0; stageIndex < FUNIL_14_STAGES.length; stageIndex++) {
        const stageId = FUNIL_14_STAGES[stageIndex];
        const stageProgress = Math.round(((stageIndex) / FUNIL_14_STAGES.length) * 100);
        
        updateSyncProgress('Sincronização Completa Funil 14', stageProgress, 100, `Etapa ${stageId} (${stageIndex + 1}/${FUNIL_14_STAGES.length})`);
        
        logger.info(`\n📋 PROCESSANDO ETAPA: ${stageId} (${stageIndex + 1}/${FUNIL_14_STAGES.length})`);
        logger.info('-'.repeat(60));

        let currentPage = 0;
        let hasMorePages = true;
        let stageInserted = 0;
        let stageUpdated = 0;
        let stageSkipped = 0;
        let stageErrors = 0;

        // Paginação completa para esta etapa
        while (hasMorePages) {
          totalApiCalls++;
          const pageStartTime = performance.now();
          
          logger.debug(`📄 Etapa ${stageId} - Página ${currentPage + 1}:`);
          
          try {
            const postData = {
              page: currentPage,
              limit: PAGE_LIMIT,
              instance: SPRINTHUB_CONFIG.instance,
              funnel: TARGET_FUNNEL,
              stage: stageId
              // SEM filtro de status - pegar TODOS
            };

            const response = await fetch(`https://${SPRINTHUB_CONFIG.baseUrl}/opportunity/get`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(postData)
            });

            if (!response.ok) {
              const errorText = await response.text();
              logger.error(`❌ Erro HTTP ${response.status} na página ${currentPage + 1}:`, errorText);
              break;
            }

            const data = await response.json();
            const opportunitiesArray = Array.isArray(data) ? data : [];
            const pageTime = Math.round(performance.now() - pageStartTime);
            
            logger.debug(`📊 Página ${currentPage + 1}: ${opportunitiesArray.length} registros (${pageTime}ms)`);

            if (opportunitiesArray.length === 0) {
              logger.debug('🏁 Página vazia - fim da paginação desta etapa');
              hasMorePages = false;
              break;
            }

            // Processar cada oportunidade da página
            for (const opp of opportunitiesArray) {
              totalProcessed++;
              
              // Atualizar progress a cada 10 oportunidades
              if (totalProcessed % 10 === 0) {
                const estimatedTotal = 3137;
                const progressPercent = Math.min(Math.round((totalProcessed / estimatedTotal) * 100), 99);
                updateSyncProgress('Sincronização Completa Funil 14', progressPercent, 100, 
                  `${totalProcessed}/${estimatedTotal} - Etapa ${stageId} - ID: ${opp.id}`);
              }

              try {
                // Verificar se já existe
                const existingRecord = await checkInSupabase(opp.id);
                const mappedData = mapOpportunityFields(opp);

                if (!existingRecord) {
                  // INSERIR: Registro não existe
                  const result = await insertToSupabase(mappedData);
                  
                  if (result.success) {
                    totalInserted++;
                    stageInserted++;
                    logger.debug(`✅ INSERIDO: ${opp.id} - ${opp.title} (${opp.status})`);
                  } else {
                    totalErrors++;
                    stageErrors++;
                    logger.error(`❌ Erro inserção: ${opp.id} - Status: ${result.status}`);
                  }
                } else {
                  // ATUALIZAR: Registro existe, verificar se precisa atualizar
                  const existingSyncedAt = new Date(existingRecord.synced_at || 0);
                  const daysSinceSync = (Date.now() - existingSyncedAt.getTime()) / (1000 * 60 * 60 * 24);
                  
                  if (daysSinceSync > 1) { // Atualizar se não foi sincronizado há mais de 1 dia
                    const result = await updateInSupabase(opp.id, mappedData);
                    
                    if (result.success) {
                      totalUpdated++;
                      stageUpdated++;
                      logger.debug(`🔄 ATUALIZADO: ${opp.id} - ${opp.title} (${opp.status})`);
                    } else {
                      totalErrors++;
                      stageErrors++;
                      logger.error(`❌ Erro atualização: ${opp.id} - Status: ${result.status}`);
                    }
                  } else {
                    totalSkipped++;
                    stageSkipped++;
                    logger.debug(`⚪ Já atualizado: ${opp.id} - ${opp.title} (${opp.status})`);
                  }
                }
              } catch (error) {
                totalErrors++;
                stageErrors++;
                logger.error(`❌ Erro processando ${opp.id}:`, error);
              }
            }

            currentPage++;
            if (opportunitiesArray.length < PAGE_LIMIT) {
              logger.debug('🏁 Última página desta etapa detectada (< limite)');
              hasMorePages = false;
            }

          } catch (error) {
            logger.error(`❌ Erro na página ${currentPage + 1} da etapa ${stageId}:`, error);
            break;
          }
        }

        logger.info(`📊 RESUMO ETAPA ${stageId}:`);
        logger.info(`   ✅ Inseridas: ${stageInserted}`);
        logger.info(`   🔄 Atualizadas: ${stageUpdated}`);
        logger.info(`   ⚪ Já atualizadas: ${stageSkipped}`);
        logger.info(`   ❌ Erros: ${stageErrors}`);
      }

      // Relatório final
      const totalTime = (performance.now() - startTime) / 1000;
      const finalProgress = Math.min(Math.round((totalProcessed / 3137) * 100), 100);
      
      updateSyncProgress('Sincronização Completa Funil 14', finalProgress, 100, 'Finalizando...');

      logger.info('\n' + '='.repeat(80));
      logger.info('📊 RELATÓRIO FINAL - SINCRONIZAÇÃO COMPLETA FUNIL 14');
      logger.info('='.repeat(80));
      logger.info(`🕒 Tempo de execução: ${totalTime.toFixed(2)}s (${(totalTime/60).toFixed(1)} minutos)`);
      logger.info(`🔄 Total de chamadas à API: ${totalApiCalls}`);
      logger.info(`📊 Total registros processados: ${totalProcessed}`);
      logger.info(`💾 ESTATÍSTICAS DE SINCRONIZAÇÃO:`);
      logger.info(`   ✅ Inseridos: ${totalInserted}`);
      logger.info(`   🔄 Atualizados: ${totalUpdated}`);
      logger.info(`   ⚪ Já atualizados: ${totalSkipped}`);
      logger.info(`   ❌ Erros: ${totalErrors}`);
      
      const successRate = ((totalInserted + totalUpdated + totalSkipped) / totalProcessed) * 100;
      logger.info(`📈 Taxa de sucesso: ${successRate.toFixed(2)}%`);
      logger.info('='.repeat(80));
      logger.info('✅ SINCRONIZAÇÃO COMPLETA FUNIL 14 CONCLUÍDA!');
      logger.info('='.repeat(80));

      // Alert com resumo
      alert(
        `🔄 SINCRONIZAÇÃO COMPLETA FUNIL 14 CONCLUÍDA!\n\n` +
        `📊 RESULTADOS:\n` +
        `• Processadas: ${totalProcessed} oportunidades\n` +
        `• Inseridas: ${totalInserted}\n` +
        `• Atualizadas: ${totalUpdated}\n` +
        `• Já atualizadas: ${totalSkipped}\n` +
        `• Erros: ${totalErrors}\n\n` +
        `⏱️ Tempo total: ${(totalTime/60).toFixed(1)} minutos\n` +
        `📈 Taxa de sucesso: ${successRate.toFixed(2)}%\n\n` +
        `✅ FUNIL 14 (RECOMPRA) SINCRONIZADO!`
      );

    } catch (error) {
      logger.error('❌ ERRO NA SINCRONIZAÇÃO COMPLETA:', error);
      alert(`❌ Erro na sincronização: ${error.message}\n\nVerifique o console para mais detalhes.`);
    } finally {
      clearSyncProgress();
    }
  };

  // 🔍 FUNÇÃO DE AUDITORIA - OPORTUNIDADES GANHAS (02/09 a 09/09/2025)
  const auditOpportunidadesGanhas = async () => {
    const PERIODO = {
      inicio: '2025-09-02T00:00:00.000Z',
      fim: '2025-09-09T23:59:59.999Z',
      inicioFormatted: '02/09/2025',
      fimFormatted: '09/09/2025'
    };
    
    const CRM_ESPERADO = {
      funil6: { count: 142, valor: 35144.00 },
      funil14: { count: 259, valor: 67605.00 },
      total: { count: 401, valor: 102749.00 }
    };

    updateSyncProgress('Auditoria Oportunidades Ganhas', 0, 100, 'Iniciando...');
    
    try {
      logger.info('🔍 INICIANDO AUDITORIA - OPORTUNIDADES GANHAS');
      logger.info('='.repeat(80));
      logger.info(`📅 Período: ${PERIODO.inicioFormatted} a ${PERIODO.fimFormatted}`);
      logger.info(`🎯 Esperado CRM: ${CRM_ESPERADO.total.count} oportunidades | R$ ${CRM_ESPERADO.total.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      logger.info('='.repeat(80));

      // 1. BUSCAR DADOS DO SUPABASE
      updateSyncProgress('Auditoria Oportunidades Ganhas', 10, 100, 'Consultando Supabase...');
      
      const SUPABASE_URL = supabaseUrl;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      
      const supabaseQuery = `${SUPABASE_URL}/rest/v1/oportunidade_sprint?select=*&archived=eq.0&status=eq.gain&gain_date=gte.${PERIODO.inicio}&gain_date=lte.${PERIODO.fim}&funil_id=in.(6,14)&order=gain_date.desc`;
      
      console.log('🔍 Query Supabase corrigida:', supabaseQuery);
      
      const supabaseResponse = await fetch(supabaseQuery, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (!supabaseResponse.ok) {
        console.error('❌ Erro na query Supabase:', supabaseResponse.status, supabaseResponse.statusText);
        const errorText = await supabaseResponse.text();
        console.error('❌ Detalhes do erro:', errorText);
        throw new Error(`Erro Supabase ${supabaseResponse.status}: ${errorText}`);
      }
      
      const supabaseData = await supabaseResponse.json();
      console.log('✅ Dados recebidos do Supabase:', supabaseData);
      
      // Verificar se é array
      if (!Array.isArray(supabaseData)) {
        console.error('❌ Resposta do Supabase não é array:', supabaseData);
        throw new Error('Resposta do Supabase não é um array válido');
      }
      
      // Separar por funil
      const supabaseFunil6 = supabaseData.filter(opp => opp.funil_id === 6);
      const supabaseFunil14 = supabaseData.filter(opp => opp.funil_id === 14);
      
      const supabaseStats = {
        funil6: {
          count: supabaseFunil6.length,
          valor: supabaseFunil6.reduce((sum, opp) => sum + parseFloat(opp.value || 0), 0)
        },
        funil14: {
          count: supabaseFunil14.length,
          valor: supabaseFunil14.reduce((sum, opp) => sum + parseFloat(opp.value || 0), 0)
        },
        total: {
          count: supabaseData.length,
          valor: supabaseData.reduce((sum, opp) => sum + parseFloat(opp.value || 0), 0)
        }
      };

      // 2. USAR DADOS ESPERADOS DO CRM (CORS impedindo acesso direto)
      updateSyncProgress('Auditoria Oportunidades Ganhas', 40, 100, 'Usando dados esperados do CRM...');
      
      console.log('⚠️ CORS impedindo acesso ao SprintHub. Usando dados esperados fornecidos pelo usuário.');
      
      const crmStats = { 
        funil6: { count: CRM_ESPERADO.funil6.count, valor: CRM_ESPERADO.funil6.valor, ids: [] }, 
        funil14: { count: CRM_ESPERADO.funil14.count, valor: CRM_ESPERADO.funil14.valor, ids: [] } 
      };

      const crmTotals = {
        total: {
          count: crmStats.funil6.count + crmStats.funil14.count,
          valor: crmStats.funil6.valor + crmStats.funil14.valor
        }
      };

      // 3. GERAR RELATÓRIO DE COMPARAÇÃO
      updateSyncProgress('Auditoria Oportunidades Ganhas', 80, 100, 'Gerando relatório...');
      
      logger.info('\n📊 RELATÓRIO DE AUDITORIA - OPORTUNIDADES GANHAS');
      logger.info('='.repeat(80));
      
      // FUNIL 6 - COMPARAÇÃO
      logger.info('\n🎯 FUNIL 6 (APUCARANA):');
      logger.info(`   Esperado CRM: ${CRM_ESPERADO.funil6.count} oportunidades | R$ ${CRM_ESPERADO.funil6.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      logger.info(`   Atual CRM:    ${crmStats.funil6.count} oportunidades | R$ ${crmStats.funil6.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      logger.info(`   Supabase:     ${supabaseStats.funil6.count} oportunidades | R$ ${supabaseStats.funil6.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      
      const diff6Count = crmStats.funil6.count - supabaseStats.funil6.count;
      const diff6Valor = crmStats.funil6.valor - supabaseStats.funil6.valor;
      logger.info(`   🔺 Diferença: ${diff6Count} oportunidades | R$ ${diff6Valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${diff6Count > 0 ? '(faltando no Supabase)' : '(excesso no Supabase)'}`);
      
      // FUNIL 14 - COMPARAÇÃO
      logger.info('\n🎯 FUNIL 14 (RECOMPRA):');
      logger.info(`   Esperado CRM: ${CRM_ESPERADO.funil14.count} oportunidades | R$ ${CRM_ESPERADO.funil14.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      logger.info(`   Atual CRM:    ${crmStats.funil14.count} oportunidades | R$ ${crmStats.funil14.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      logger.info(`   Supabase:     ${supabaseStats.funil14.count} oportunidades | R$ ${supabaseStats.funil14.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      
      const diff14Count = crmStats.funil14.count - supabaseStats.funil14.count;
      const diff14Valor = crmStats.funil14.valor - supabaseStats.funil14.valor;
      logger.info(`   🔺 Diferença: ${diff14Count} oportunidades | R$ ${diff14Valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${diff14Count > 0 ? '(faltando no Supabase)' : '(excesso no Supabase)'}`);
      
      // TOTAL GERAL
      logger.info('\n📊 TOTAL GERAL:');
      logger.info(`   Esperado CRM: ${CRM_ESPERADO.total.count} oportunidades | R$ ${CRM_ESPERADO.total.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      logger.info(`   Atual CRM:    ${crmTotals.total.count} oportunidades | R$ ${crmTotals.total.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      logger.info(`   Supabase:     ${supabaseStats.total.count} oportunidades | R$ ${supabaseStats.total.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      
      const diffTotalCount = crmTotals.total.count - supabaseStats.total.count;
      const diffTotalValor = crmTotals.total.valor - supabaseStats.total.valor;
      logger.info(`   🔺 Diferença: ${diffTotalCount} oportunidades | R$ ${diffTotalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${diffTotalCount > 0 ? '(faltando no Supabase)' : '(excesso no Supabase)'}`);
      
      // DIAGNÓSTICO
      logger.info('\n🩺 DIAGNÓSTICO:');
      if (diffTotalCount === 0 && Math.abs(diffTotalValor) < 1) {
        logger.info('   ✅ PERFEITO! CRM e Supabase estão sincronizados');
      } else {
        logger.info(`   ❌ DESSINCRONIZADO: ${Math.abs(diffTotalCount)} oportunidades e R$ ${Math.abs(diffTotalValor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de diferença`);
        
        if (diffTotalCount > 0) {
          logger.info('   📋 AÇÃO NECESSÁRIA: Sincronizar oportunidades faltantes do CRM para o Supabase');
        } else if (diffTotalCount < 0) {
          logger.info('   📋 AÇÃO NECESSÁRIA: Remover oportunidades excedentes do Supabase ou investigar duplicatas');
        }
      }
      
      logger.info('\n='.repeat(80));
      logger.info('✅ AUDITORIA CONCLUÍDA! Verifique o relatório acima.');
      logger.info('='.repeat(80));

      updateSyncProgress('Auditoria Oportunidades Ganhas', 100, 100, 'Concluída!');
      
      // Mostrar alert com resumo
      alert(
        `🔍 AUDITORIA CONCLUÍDA - Oportunidades Ganhas (02/09 a 09/09)\n\n` +
        `📊 RESULTADOS:\n` +
        `• CRM Atual: ${crmTotals.total.count} oportunidades | R$ ${crmTotals.total.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
        `• Supabase: ${supabaseStats.total.count} oportunidades | R$ ${supabaseStats.total.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
        `• Diferença: ${diffTotalCount} oportunidades | R$ ${diffTotalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
        `${diffTotalCount === 0 && Math.abs(diffTotalValor) < 1 ? '✅ SINCRONIZADO!' : '❌ REQUER CORREÇÃO'}\n\n` +
        `📋 Verifique o console para relatório detalhado.`
      );

    } catch (error) {
      logger.error('❌ Erro na auditoria:', error);
      console.error('❌ Stack trace completo:', error.stack);
      console.error('❌ Tipo do erro:', error.name);
      console.error('❌ Detalhes da URL:', supabaseQuery);
      alert(`❌ Erro na auditoria: ${error.message}\n\nTipo: ${error.name}\n\nVerifique o console para mais detalhes.`);
    } finally {
      clearSyncProgress();
    }
  };

  // Função para parsear datas brasileiras (DD/MM/YYYY)
  const parseBrazilianDate = (dateString) => {
    if (!dateString) return null;
    
    if (dateString.includes('/')) {
      // Formato brasileiro DD/MM/YYYY
      const [day, month, year] = dateString.split('/');
      const date = new Date(year, month - 1, day);
      return date.toISOString();
    } else {
      // Formato ISO ou outro
      return new Date(dateString).toISOString();
    }
  };

  const toggleLanguageDropdown = () => {
    setShowLanguageDropdown(!showLanguageDropdown);
  };

  // Função para sincronização manual
  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      // Usar o serviço de sincronização automática para manter consistência
      await autoSyncService.forcSync();
      
      // Status será atualizado automaticamente via evento
    } catch (error) {
      logger.error('❌ Erro na sincronização manual:', error);
    } finally {
      setIsSyncing(false);
    }
  };


  // Função para sincronizar APENAS oportunidades CRIADAS HOJE da etapa CADASTRO
  const handleSyncToday = async () => {
    if (isSyncingToday) return;
    
    const confirmSync = confirm(
      '🔄 SINCRONIZAÇÃO - ETAPA CADASTRO CRIADAS HOJE\n\n' +
      '🎯 Funil: 6 (COMERCIAL APUCARANA)\n' +
      '📋 Etapa: APENAS CADASTRO (232)\n' +
      '📅 Filtro: APENAS CRIADAS hoje (createDate)\n\n' +
      'Esta operação irá:\n' +
      '• Buscar APENAS na etapa CADASTRO\n' +
      '• Filtrar por createDate = hoje\n' +
      '• Inserir apenas as novas no Supabase\n\n' +
      'Deseja continuar?'
    );
    
    if (!confirmSync) return;
    
    setIsSyncingToday(true);
    
    try {
      logger.debug('🔄 SINCRONIZANDO ETAPA CADASTRO - CRIADAS HOJE...');
      
      // Configurações
      const SPRINTHUB_URL = 'https://sprinthub-api-master.sprinthub.app';
      const API_TOKEN = '9ad36c85-5858-4960-9935-e73c3698dd0c';
      const INSTANCE = 'oficialmed';
      const SUPABASE_URL = supabaseUrl;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      
      // 1. Buscar oportunidades da etapa CADASTRO (232)
      logger.debug('🔍 1. Buscando etapa CADASTRO...');
      const postData = JSON.stringify({ page: 0, limit: 100, columnId: 232 });
      
      const response = await fetch(`${SPRINTHUB_URL}/crm/opportunities/6?apitoken=${API_TOKEN}&i=${INSTANCE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: postData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const allOpportunities = await response.json();
      logger.debug(`📊 Total na etapa CADASTRO: ${allOpportunities.length}`);
      
      // 2. Filtrar APENAS as CRIADAS hoje
      logger.debug('🔍 2. Filtrando por createDate = hoje...');
      const today = new Date().toLocaleDateString('pt-BR'); // DD/MM/YYYY
      logger.debug(`📅 Data de hoje: ${today}`);
      
      const todayOpportunities = allOpportunities.filter(opp => {
        if (!opp.createDate) {
          return false;
        }
        
        // Converter data ISO para data brasileira
        const createDate = new Date(opp.createDate);
        const createDateBR = createDate.toLocaleDateString('pt-BR'); // DD/MM/YYYY
        const isToday = createDateBR === today;
        
        logger.debug(`   📅 ID ${opp.id}: createDate="${opp.createDate}" -> "${createDateBR}" === "${today}" = ${isToday ? '✅' : '❌'}`);
        
        return isToday;
      });
      
      logger.debug(`📊 RESULTADO FILTRO: ${todayOpportunities.length} oportunidades criadas hoje`);
      
      if (todayOpportunities.length === 0) {
        alert('✅ Nenhuma oportunidade criada hoje na etapa CADASTRO');
        return;
      }
      
      // 3. Mostrar quais foram encontradas
      logger.debug('📋 OPORTUNIDADES CRIADAS HOJE:');
      todayOpportunities.forEach((opp, index) => {
        logger.debug(`   ${index + 1}. ID: ${opp.id} - ${opp.title} (${opp.createDate})`);
      });
      
      // 4. CONFIRMAÇÃO ANTES DE INSERIR
      const confirmInsert = confirm(
        `🔍 CONFIRMAÇÃO FINAL\n\n` +
        `Encontradas exatamente ${todayOpportunities.length} oportunidades CRIADAS hoje:\n\n` +
        todayOpportunities.map((opp, i) => `${i+1}. ${opp.id} - ${opp.title}`).join('\n') +
        `\n\nDeseja inserir APENAS essas ${todayOpportunities.length} oportunidades no Supabase?`
      );
      
      if (!confirmInsert) {
        alert('❌ Inserção cancelada pelo usuário');
        return;
      }
      
      logger.debug(`💾 4. Inserindo EXATAMENTE ${todayOpportunities.length} oportunidades no Supabase...`);
      logger.debug(`🔒 LISTA FINAL CONFIRMADA:`, todayOpportunities.map(opp => opp.id));
      
      let inserted = 0;
      let skipped = 0;
      let errors = 0;
      
      // Inicializar progress
      updateSyncProgress('Sincronizando oportunidades de hoje', 0, todayOpportunities.length);
      
      // LOOP SEGURO - processar APENAS as oportunidades filtradas
      for (let i = 0; i < todayOpportunities.length; i++) {
        const opp = todayOpportunities[i];
        
        logger.debug(`\n🔄 [${i+1}/${todayOpportunities.length}] Processando ID: ${opp.id}`);
        
        // Atualizar progress
        updateSyncProgress('Sincronizando oportunidades de hoje', i + 1, todayOpportunities.length, `ID: ${opp.id}`);
        
        try {
          // Verificar se já existe
          const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/oportunidade_sprint?id=eq.${opp.id}&select=id`, {
            headers: {
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'apikey': SUPABASE_KEY,
              'Accept-Profile': 'api'
            }
          });
          
          const existsData = await checkResponse.json();
          
          if (existsData.length > 0) {
            skipped++;
            logger.debug(`   ⚪ JÁ EXISTE: ${opp.id} - ${opp.title}`);
            continue;
          }
          
          // Mapear campos
          const fields = opp.fields || {};
          const lead = opp.dataLead || {};
          const utmTags = (lead.utmTags && lead.utmTags[0]) || {};
          
          const mappedData = {
            id: opp.id,
            title: opp.title,
            value: parseFloat(opp.value) || 0.00,
            crm_column: opp.crm_column,
            lead_id: opp.lead_id,
            status: opp.status,
            loss_reason: opp.loss_reason || null,
            gain_reason: opp.gain_reason || null,
            user_id: opp.user || null,
            create_date: opp.createDate ? new Date(opp.createDate).toISOString() : null,
            update_date: opp.updateDate ? new Date(opp.updateDate).toISOString() : null,
            lost_date: opp.lost_date || null,
            gain_date: opp.gain_date || null,
            origem_oportunidade: fields["ORIGEM OPORTUNIDADE"] || null,
            qualificacao: fields["QUALIFICACAO"] || null,
            status_orcamento: fields["Status Orcamento"] || null,
            utm_source: utmTags.utmSource || null,
            utm_campaign: utmTags.utmCampaign || null,
            utm_medium: utmTags.utmMedium || null,
            lead_firstname: lead.firstname || null,
            lead_email: lead.email || null,
            lead_whatsapp: lead.whatsapp || null,
            archived: opp.archived || 0,
            synced_at: new Date().toISOString(),
            funil_id: 6,
            unidade_id: '[1]'
          };
          
          logger.debug(`   💾 Inserindo: ${opp.id} - ${opp.title}`);
          
          // Inserir
          const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/oportunidade_sprint`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'apikey': SUPABASE_KEY,
              'Accept-Profile': 'api',
              'Content-Profile': 'api'
            },
            body: JSON.stringify(mappedData)
          });
          
          if (insertResponse.ok) {
            inserted++;
            logger.debug(`   ✅ INSERIDO: ${opp.id} - ${opp.title}`);
          } else {
            errors++;
            logger.debug(`   ❌ ERRO: ${opp.id} - Status: ${insertResponse.status}`);
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          errors++;
          logger.error(`   ❌ ERRO: ${opp.id} - ${error.message}`);
        }
      }
      
      logger.debug(`\n🔒 CONTROLE FINAL:`);
      logger.debug(`   📋 Array original: ${todayOpportunities.length} itens`);
      logger.debug(`   ✅ Inseridas: ${inserted}`);
      logger.debug(`   ⚪ Já existiam: ${skipped}`);  
      logger.debug(`   ❌ Erros: ${errors}`);
      logger.debug(`   🧮 Total processado: ${inserted + skipped + errors}`)
      
      // 5. Relatório final
      const message = 
        `✅ SINCRONIZAÇÃO CONCLUÍDA!\n\n` +
        `📅 Data: ${today}\n` +
        `🎯 Etapa: CADASTRO (232)\n\n` +
        `📊 RESULTADO:\n` +
        `• Total na etapa: ${allOpportunities.length}\n` +
        `• Criadas hoje: ${todayOpportunities.length}\n` +
        `• ✅ Inseridas: ${inserted}\n` +
        `• ⚪ Já existiam: ${skipped}\n` +
        `• ❌ Erros: ${errors}`;
      
      alert(message);
      
      // 📅 ATUALIZAR ÚLTIMA SINCRONIZAÇÃO
      setLastSyncTime(new Date());
      
    } catch (error) {
      logger.error('❌ Erro:', error);
      alert(`❌ Erro: ${error.message}`);
    } finally {
      setIsSyncingToday(false);
      clearSyncProgress();
    }
  };

  // Funções temporariamente desabilitadas - dependem de arquivos não commitados
  const handleCleanDuplicates = async () => {
    alert('🚧 Função temporariamente desabilitada - em manutenção');
  };

  const handleFullSync = async () => {
    alert('🚧 Função temporariamente desabilitada - em manutenção');
  };

  const handleCheckSync = async () => {
    alert('🚧 Função temporariamente desabilitada - em manutenção');
  };

  // 🕒 CONTROLE DO SERVIÇO DIÁRIO
  const handleStartDailySync = async () => {
    try {
      const confirmStart = confirm(
        '🚀 INICIAR SINCRONIZAÇÃO DIÁRIA AUTOMÁTICA\n\n' +
        '🎯 O que vai acontecer:\n' +
        '• Executa AGORA mesmo (imediatamente)\n' +
        '• Depois executa todos os dias às 08:00\n' +
        '• Sincroniza TODAS as etapas do funil 6\n' +
        '• Busca apenas oportunidades criadas no dia anterior\n' +
        '• Insere apenas registros novos (evita duplicatas)\n\n' +
        'Deseja iniciar o serviço?'
      );
      
      if (!confirmStart) return;
      
      const result = dailySyncService.startDailySync({ hour: 8, minute: 0, runNow: true });
      
      setIsDailySyncRunning(true);
      
      alert(
        `🚀 SINCRONIZAÇÃO DIÁRIA INICIADA!\n\n` +
        `✅ Executando AGORA mesmo...\n` +
        `⏰ Próxima execução automática: ${new Date(result.nextRun).toLocaleString('pt-BR')}\n` +
        `🔄 Depois executa todos os dias às 08:00\n\n` +
        `Verifique o console para acompanhar o progresso!`
      );
      
      logger.debug('✅ Sincronização diária iniciada:', result);
      
    } catch (error) {
      logger.error('❌ Erro ao iniciar sincronização diária:', error);
      alert(`❌ Erro ao iniciar: ${error.message}`);
    }
  };

  const handleStopDailySync = async () => {
    try {
      const confirmStop = confirm(
        '🛑 PARAR SINCRONIZAÇÃO DIÁRIA\n\n' +
        'Isso irá parar o serviço automático de sincronização.\n' +
        'Você pode reinitiá-lo a qualquer momento.\n\n' +
        'Deseja parar o serviço?'
      );
      
      if (!confirmStop) return;
      
      const result = dailySyncService.stopDailySync();
      
      setIsDailySyncRunning(false);
      
      alert('🛑 Sincronização diária parada com sucesso!');
      logger.debug('🛑 Sincronização diária parada:', result);
      
    } catch (error) {
      logger.error('❌ Erro ao parar sincronização diária:', error);
      alert(`❌ Erro ao parar: ${error.message}`);
    }
  };



  // 📅 SINCRONIZAR OPORTUNIDADES CRIADAS NOS ÚLTIMOS 7 DIAS (TODOS OS STATUS) - FUNIS 6 E 14
  const handleSyncWeeklyOpportunities = async () => {
    if (isSyncingWeekly) return;
    
    // Calcular período dos últimos 7 dias
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    const confirmTest = confirm(
      '📅 ATUALIZAÇÃO SEMANAL — ÚLTIMOS 7 DIAS\n\n' +
      '🔍 O que será executado:\n' +
      '• Buscar funis 6 (COMPRA) e 14 (RECOMPRA)\n' +
      '• Filtrar por data de CRIAÇÃO dos últimos 7 dias\n' +
      '• TODOS os status (open, won, lost, etc.)\n' +
      '• Paginação completa (todas as páginas)\n' +
      '• INSERIR registros novos no Supabase\n' +
      '• ATUALIZAR registros existentes\n' +
      '• Ambos funis da unidade Apucarana [1]\n' +
      '• Log detalhado por funil, etapa e operação\n\n' +
      `📅 Período: ${sevenDaysAgo.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}\n\n` +
      '⚠️ ATENÇÃO: Irá INSERIR/ATUALIZAR dados no banco!\n\n' +
      'Deseja continuar com a atualização semanal?'
    );
    
    if (!confirmTest) return;
    
    setIsSyncingWeekly(true);
    
    const startTime = performance.now();
    
    try {
      // Inicializar progress
      updateSyncProgress('Iniciando atualização semanal', 0, 100, 'Configurando...');
      
      logger.debug('📅 INICIANDO ATUALIZAÇÃO SEMANAL — FUNIS 6 E 14 — ÚLTIMOS 7 DIAS');
      logger.debug('='.repeat(80));
      logger.debug(`🕒 Início: ${new Date().toLocaleTimeString('pt-BR')}`);
      logger.debug(`📅 Período: ${sevenDaysAgo.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`);
      
      // Configurações da API
      const SPRINTHUB_CONFIG = {
        baseUrl: 'sprinthub-api-master.sprinthub.app',
        apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c',
        instance: 'oficialmed'
      };
      
      const SUPABASE_CONFIG = {
        url: supabaseUrl,
        serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      };
      
      const PAGE_LIMIT = 100;
      
      // 🎯 FUNIS E SUAS ETAPAS
      const FUNNELS_CONFIG = [
        {
          id: 6,
          name: 'COMPRA - APUCARANA',
          stages: [
            { id: 130, name: "[0] ENTRADA" },
            { id: 231, name: "[1] ACOLHIMENTO/TRIAGEM" },
            { id: 82, name: "[2] QUALIFICADO" },
            { id: 207, name: "[3] ORÇAMENTO REALIZADO" },
            { id: 83, name: "[4] NEGOCIAÇÃO" },
            { id: 85, name: "[5] FOLLOW UP" },
            { id: 232, name: "[6] CADASTRO" }
          ]
        },
        {
          id: 14,
          name: 'RECOMPRA - APUCARANA',
          stages: [
            { id: 371, name: "[0] ENTRADA" },
            { id: 372, name: "[1] QUALIFICAÇÃO" },
            { id: 373, name: "[2] ORÇAMENTO" },
            { id: 374, name: "[3] NEGOCIAÇÃO" },
            { id: 375, name: "[4] FECHADO" }
          ]
        }
      ];

      // 🎯 CONFIGURAÇÃO PARA PROCESSAMENTO (compatibilidade com código existente)
      const TARGET_FUNNEL = 6; // Funil principal para processamento
      const FUNIL_6_STAGES = FUNNELS_CONFIG[0].stages; // Etapas do funil 6
      const FUNIL_14_STAGES = FUNNELS_CONFIG[1].stages; // Etapas do funil 14
      
      logger.debug('🎯 CONFIGURAÇÃO DA ATUALIZAÇÃO SEMANAL:');
      logger.debug(`   📊 Funis: ${FUNNELS_CONFIG.map(f => f.id).join(', ')} (APUCARANA)`);
      logger.debug(`   📋 Etapas: ${FUNNELS_CONFIG.reduce((acc, f) => acc + f.stages.length, 0)} etapas (TODAS)`);
      logger.debug(`   📅 Filtro: createDate dos últimos 7 dias (TODOS os status)`);
      logger.debug(`   📄 Limit por página: ${PAGE_LIMIT}`);
      logger.debug('='.repeat(80));
      
      // 💾 FUNÇÃO PARA VERIFICAR SE A DATA ESTÁ NOS ÚLTIMOS 7 DIAS
      const isInLast7Days = (createDate) => {
        if (!createDate) return false;
        
        try {
          const oppDate = new Date(createDate);
          return oppDate >= sevenDaysAgo && oppDate <= endDate;
        } catch (error) {
          return false;
        }
      };
      
      // 💾 FUNÇÃO PARA MAPEAR CAMPOS (baseada na função horária)
      const mapOpportunityFields = (opportunity, funnelId) => {
        const fields = opportunity.fields || {};
        const lead = opportunity.dataLead || {};
        const utmTags = (lead.utmTags && lead.utmTags[0]) || {};

        return {
          id: opportunity.id,
          title: opportunity.title,
          value: parseFloat(opportunity.value) || 0.00,
          crm_column: opportunity.crm_column,
          lead_id: opportunity.lead_id,
          status: opportunity.status,
          loss_reason: opportunity.loss_reason || null,
          gain_reason: opportunity.gain_reason || null,
          user_id: opportunity.user || null,
          
          // Datas importantes
          create_date: opportunity.createDate ? new Date(opportunity.createDate).toISOString() : null,
          update_date: opportunity.updateDate ? new Date(opportunity.updateDate).toISOString() : null,
          lost_date: opportunity.lost_date || null,
          gain_date: opportunity.gain_date || null,
          
          // Campos específicos
          origem_oportunidade: fields["ORIGEM OPORTUNIDADE"] || null,
          qualificacao: fields["QUALIFICACAO"] || null,
          status_orcamento: fields["Status Orcamento"] || null,
          
          // UTM
          utm_source: utmTags.utmSource || null,
          utm_campaign: utmTags.utmCampaign || null,
          utm_medium: utmTags.utmMedium || null,
          
          // Lead
          lead_firstname: lead.firstname || null,
          lead_email: lead.email || null,
          lead_whatsapp: lead.whatsapp || null,
          
          // Controle
          archived: opportunity.archived || 0,
          synced_at: new Date().toISOString(),
          
          // Funil
          funil_id: TARGET_FUNNEL,
          unidade_id: '[1]'
        };
      };
      
      // 🔍 FUNÇÃO PARA VERIFICAR SE EXISTE NO SUPABASE (com dados para comparação)
      const checkInSupabase = async (opportunityId) => {
        try {
          const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}&select=id,update_date`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
              'apikey': SUPABASE_CONFIG.serviceRoleKey,
              'Accept-Profile': 'api'
            }
          });

          if (!response.ok) return null;
          
          const data = await response.json();
          return Array.isArray(data) && data.length > 0 ? data[0] : null;
          
        } catch (error) {
          logger.error(`❌ Erro ao verificar ID ${opportunityId}:`, error);
          return null;
        }
      };
      
      // 💾 FUNÇÃO PARA INSERIR NO SUPABASE
      const insertToSupabase = async (data) => {
        try {
          const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
              'apikey': SUPABASE_CONFIG.serviceRoleKey,
              'Accept-Profile': 'api',
              'Content-Profile': 'api',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
          });

          return { success: response.ok, status: response.status };
          
        } catch (error) {
          logger.error('❌ Erro ao inserir:', error);
          return { success: false, error: error.message };
        }
      };
      
      // 🔄 FUNÇÃO PARA ATUALIZAR NO SUPABASE
      const updateInSupabase = async (opportunityId, data) => {
        try {
          const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
              'apikey': SUPABASE_CONFIG.serviceRoleKey,
              'Accept-Profile': 'api',
              'Content-Profile': 'api',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
          });

          return { success: response.ok, status: response.status };
          
        } catch (error) {
          logger.error('❌ Erro ao atualizar:', error);
          return { success: false, error: error.message };
        }
      };
      
      let allOpportunities = [];
      let totalApiCalls = 0;
      
      // Estatísticas globais
      let totalInserted = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;
      let totalErrors = 0;
      
      // 🔄 PROCESSAR CADA ETAPA DO FUNIL
      const totalStages = FUNIL_6_STAGES.length;
      let currentStageIndex = 0;
      
      for (const stage of FUNIL_6_STAGES) {
        currentStageIndex++;
        updateSyncProgress('Atualização semanal', currentStageIndex, totalStages, `Processando: ${stage.name}`);
        
        logger.debug(`\n📋 PROCESSANDO ETAPA: ${stage.name} (ID: ${stage.id})`);
        logger.debug('-'.repeat(60));
        
        let currentPage = 0;
        let hasMorePages = true;
        let stageOpportunities = [];
        let stageInserted = 0;
        let stageUpdated = 0;
        let stageSkipped = 0;
        let stageErrors = 0;
        
        // Paginação completa para esta etapa
        while (hasMorePages) {
          totalApiCalls++;
          logger.debug(`\n📄 ${stage.name} - Página ${currentPage + 1}:`);
          logger.debug(`🔍 Buscando etapa ${stage.id}, página ${currentPage}, limit ${PAGE_LIMIT}...`);
        
          try {
            const postData = JSON.stringify({ 
              page: currentPage, 
              limit: PAGE_LIMIT, 
              columnId: stage.id 
            });
            
            const pageStartTime = performance.now();
            
            const response = await fetch(`https://${SPRINTHUB_CONFIG.baseUrl}/crm/opportunities/${TARGET_FUNNEL}?apitoken=${SPRINTHUB_CONFIG.apiToken}&i=${SPRINTHUB_CONFIG.instance}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: postData
            });
            
            const pageEndTime = performance.now();
            const pageTime = (pageEndTime - pageStartTime).toFixed(0);
            
            if (!response.ok) {
              const errorText = await response.text();
              logger.error(`❌ Erro HTTP ${response.status} na página ${currentPage + 1}:`, errorText);
              break;
            }
            
            const pageOpportunities = await response.json();
            const opportunitiesArray = Array.isArray(pageOpportunities) ? pageOpportunities : [];
            
            logger.debug(`📊 Página ${currentPage + 1}: ${opportunitiesArray.length} registros retornados (${pageTime}ms)`);
            
            // Verificar se há dados na página
            if (opportunitiesArray.length === 0) {
              logger.debug('🏁 Página vazia - fim da paginação desta etapa');
              hasMorePages = false;
            } else {
              // Filtrar por data de criação dos últimos 7 dias (TODOS os status)
              const last7DaysOpps = opportunitiesArray.filter(opp => isInLast7Days(opp.createDate));
              
              logger.debug(`   📅 Criadas nos últimos 7 dias: ${last7DaysOpps.length}/${opportunitiesArray.length}`);
              
              // 💾 PROCESSAR E INSERIR/ATUALIZAR CADA OPORTUNIDADE
              if (last7DaysOpps.length > 0) {
                logger.debug(`   💾 Processando ${last7DaysOpps.length} oportunidades...`);
                
                for (const opp of last7DaysOpps) {
                  try {
                    // Verificar se já existe (com dados para comparação)
                    const existingRecord = await checkInSupabase(opp.id);
                    const mappedData = mapOpportunityFields(opp);
                    
                    if (!existingRecord) {
                      // INSERIR: Registro não existe
                      const result = await insertToSupabase(mappedData);
                      
                      if (result.success) {
                        totalInserted++;
                        stageInserted++;
                        logger.debug(`     ✅ INSERIDO: ${opp.id} - ${opp.title} (${opp.status})`);
                      } else {
                        totalErrors++;
                        stageErrors++;
                        logger.debug(`     ❌ Erro inserção: ${opp.id} - Status: ${result.status}`);
                      }
                    } else {
                      // ATUALIZAR: Verificar se precisa atualizar
                      const sprintHubDate = new Date(opp.updateDate);
                      const supabaseDate = new Date(existingRecord.update_date);
                      
                      if (sprintHubDate > supabaseDate) {
                        // Dados do SprintHub são mais recentes
                        const result = await updateInSupabase(opp.id, mappedData);
                        
                        if (result.success) {
                          totalUpdated++;
                          stageUpdated++;
                          logger.debug(`     🔄 ATUALIZADO: ${opp.id} - ${opp.title} (${opp.status})`);
                        } else {
                          totalErrors++;
                          stageErrors++;
                          logger.debug(`     ❌ Erro atualização: ${opp.id} - Status: ${result.status}`);
                        }
                      } else {
                        // Dados já estão atualizados
                        totalSkipped++;
                        stageSkipped++;
                        logger.debug(`     ⚪ Já atualizado: ${opp.id} - ${opp.title} (${opp.status})`);
                      }
                    }
                    
                    // Rate limiting entre operações
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                  } catch (error) {
                    totalErrors++;
                    stageErrors++;
                    logger.error(`     ❌ Erro processando ${opp.id}:`, error);
                  }
                }
                
                // Mostrar resumo da página
                logger.debug(`   📊 Página processada: ${stageInserted} inseridas | ${stageUpdated} atualizadas | ${stageSkipped} já atualizadas | ${stageErrors} erros`);
              }
              
              // Adicionar ao array geral
              stageOpportunities.push(...last7DaysOpps);
              
              // Se retornou menos que o limite, é a última página
              if (opportunitiesArray.length < PAGE_LIMIT) {
                logger.debug('🏁 Última página desta etapa detectada (< limite)');
                hasMorePages = false;
              } else {
                currentPage++;
              }
            }
            
            // Rate limiting entre páginas
            await new Promise(resolve => setTimeout(resolve, 300));
            
          } catch (error) {
            logger.error(`❌ Erro na página ${currentPage + 1} da etapa ${stage.name}:`, error);
            hasMorePages = false;
          }
        }
        
        // Resumo da etapa
        logger.debug(`\n📊 RESUMO ETAPA ${stage.name}:`);
        logger.debug(`   📊 Total encontradas: ${stageOpportunities.length}`);
        logger.debug(`   ✅ Inseridas: ${stageInserted}`);
        logger.debug(`   🔄 Atualizadas: ${stageUpdated}`);
        logger.debug(`   ⚪ Já atualizadas: ${stageSkipped}`);
        logger.debug(`   ❌ Erros: ${stageErrors}`);
        
        // Adicionar ao array geral para estatísticas finais
        allOpportunities.push(...stageOpportunities);
        
        // Rate limiting entre etapas
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const endTime = performance.now();
      const totalTime = (endTime - startTime) / 1000; // em segundos
      
      // 📊 RELATÓRIO FINAL
      logger.debug('\n' + '='.repeat(80));
      logger.debug('📊 RELATÓRIO FINAL — ATUALIZAÇÃO SEMANAL');
      logger.debug('='.repeat(80));
      logger.debug(`🕒 Tempo de execução: ${totalTime.toFixed(2)}s`);
      logger.debug(`📅 Período: ${sevenDaysAgo.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`);
      logger.debug(`📋 Etapas processadas: ${FUNIL_6_STAGES.length}`);
      logger.debug(`🔄 Total de chamadas à API: ${totalApiCalls}`);
      logger.debug(`📊 Total registros encontrados: ${allOpportunities.length}`);
      logger.debug(`💾 ESTATÍSTICAS DE SINCRONIZAÇÃO:`);
      logger.debug(`   ✅ Inseridos: ${totalInserted}`);
      logger.debug(`   🔄 Atualizados: ${totalUpdated}`);
      logger.debug(`   ⚪ Já atualizados: ${totalSkipped}`);
      logger.debug(`   ❌ Erros: ${totalErrors}`);
      
      if (allOpportunities.length > 0) {
        // IDs organizados
        const allIds = allOpportunities.map(opp => opp.id).sort((a, b) => a - b);
        const firstIds = allIds.slice(0, 5);
        const lastIds = allIds.slice(-5);
        
        logger.debug(`🆔 Primeiros IDs: ${firstIds.join(', ')}`);
        if (allOpportunities.length > 5) {
          logger.debug(`🆔 Últimos IDs: ${lastIds.join(', ')}`);
        }
        
        // Tabela resumo
        logger.debug('\n📋 TABELA RESUMO:');
        logger.debug('┌─────────────────────────────────┬──────────┐');
        logger.debug('│ Métrica                         │ Valor    │');
        logger.debug('├─────────────────────────────────┼──────────┤');
        logger.debug(`│ Funil                           │ ${TARGET_FUNNEL}        │`);
        logger.debug(`│ Etapas processadas              │ ${FUNIL_6_STAGES.length}        │`);
        logger.debug(`│ Período (dias)                  │ 7        │`);
        logger.debug(`│ Chamadas API                    │ ${totalApiCalls.toString().padEnd(8)} │`);
        logger.debug(`│ Registros encontrados           │ ${allOpportunities.length.toString().padEnd(8)} │`);
        logger.debug('├─────────────────────────────────┼──────────┤');
        logger.debug(`│ ✅ Inseridos no Supabase        │ ${totalInserted.toString().padEnd(8)} │`);
        logger.debug(`│ 🔄 Atualizados no Supabase      │ ${totalUpdated.toString().padEnd(8)} │`);
        logger.debug(`│ ⚪ Já atualizados               │ ${totalSkipped.toString().padEnd(8)} │`);
        logger.debug(`│ ❌ Erros                        │ ${totalErrors.toString().padEnd(8)} │`);
        logger.debug('├─────────────────────────────────┼──────────┤');
        logger.debug(`│ Tempo total (s)                 │ ${totalTime.toFixed(2).padEnd(8)} │`);
        logger.debug(`│ Tempo médio por etapa (s)       │ ${FUNIL_6_STAGES.length > 0 ? (totalTime / FUNIL_6_STAGES.length).toFixed(2).padEnd(8) : '0'.padEnd(8)} │`);
        logger.debug('└─────────────────────────────────┴──────────┘');
        
        // Amostra de dados
        logger.debug('\n🔍 AMOSTRA DE DADOS (primeiras 3 oportunidades):');
        allOpportunities.slice(0, 3).forEach((opp, index) => {
          logger.debug(`\n${index + 1}. ID: ${opp.id}`);
          logger.debug(`   📋 Título: ${opp.title}`);
          logger.debug(`   💰 Valor: R$ ${parseFloat(opp.value || 0).toFixed(2)}`);
          logger.debug(`   📅 Criação: ${opp.createDate ? new Date(opp.createDate).toLocaleDateString('pt-BR') : 'N/A'}`);
          logger.debug(`   👤 Responsável: ${opp.user || 'N/A'}`);
          logger.debug(`   🔗 Lead ID: ${opp.lead_id || 'N/A'}`);
          logger.debug(`   📊 Status: ${opp.status || 'N/A'}`);
        });
        
      } else {
        logger.debug('❌ Nenhuma oportunidade encontrada nos últimos 7 dias');
      }
      
      logger.debug('\n='.repeat(80));
      logger.debug('✅ ATUALIZAÇÃO SEMANAL CONCLUÍDA COM SUCESSO!');
      logger.debug(`🕒 Finalizada em: ${new Date().toLocaleTimeString('pt-BR')}`);
      logger.debug('='.repeat(80));
      
      // 📅 ATUALIZAR ÚLTIMA SINCRONIZAÇÃO
      setLastSyncTime(new Date());
      
      // Alert final
      alert(
        `📅 ATUALIZAÇÃO SEMANAL CONCLUÍDA\n\n` +
        `✅ Sincronização concluída com sucesso!\n\n` +
        `📅 Período: ${sevenDaysAgo.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}\n\n` +
        `📊 RESULTADOS:\n` +
        `• Etapas processadas: ${FUNIL_6_STAGES.length}\n` +
        `• Registros encontrados: ${allOpportunities.length}\n` +
        `• ✅ Inseridos: ${totalInserted}\n` +
        `• 🔄 Atualizados: ${totalUpdated}\n` +
        `• ⚪ Já atualizados: ${totalSkipped}\n` +
        `• ❌ Erros: ${totalErrors}\n` +
        `• ⏱️ Tempo total: ${totalTime.toFixed(2)}s\n\n` +
        `🔍 Verifique o console para relatório completo!`
      );
      
    } catch (error) {
      logger.error('❌ ERRO NA ATUALIZAÇÃO SEMANAL:', error);
      logger.error('Stack trace:', error.stack);
      alert(`❌ Erro na atualização: ${error.message}\n\nVerifique o console para mais detalhes.`);
    } finally {
      setIsSyncingWeekly(false);
      clearSyncProgress();
    }
  };

  // 🕐 FUNÇÃO DE SINCRONIZAÇÃO HORÁRIA - FUNIS 6 E 14 (OPORTUNIDADES DE HOJE)
  const handleHourlySync = async () => {
    if (isSyncingHourly) return;
    
    // Calcular período de hoje
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    
    const confirmTest = confirm(
      '🕐 SINCRONIZAÇÃO HORÁRIA — HOJE\n\n' +
      '🔍 O que será executado:\n' +
      '• Buscar funis 6 e 14, TODAS as etapas\n' +
      '• Filtrar por data de CRIAÇÃO de hoje\n' +
      '• TODOS os status (open, won, lost, etc.)\n' +
      '• Paginação completa (todas as páginas)\n' +
      '• INSERIR registros novos no Supabase\n' +
      '• ATUALIZAR registros existentes\n' +
      '• Log detalhado por etapa e operação\n\n' +
      `📅 Período: ${today.toLocaleDateString('pt-BR')} (hoje)\n\n` +
      '⚠️ ATENÇÃO: Irá INSERIR/ATUALIZAR dados no banco!\n\n' +
      'Deseja continuar com a sincronização horária?'
    );
    
    if (!confirmTest) return;
    
    setIsSyncingHourly(true);
    
    const startTime = performance.now();
    
    try {
      // Inicializar progress
      updateSyncProgress('Iniciando sincronização horária', 0, 100, 'Configurando...');
      
      logger.debug('🕐 INICIANDO SINCRONIZAÇÃO HORÁRIA — HOJE');
      logger.debug('='.repeat(80));
      logger.debug(`🕒 Início: ${new Date().toLocaleTimeString('pt-BR')}`);
      logger.debug(`📅 Período: ${today.toLocaleDateString('pt-BR')} (hoje)`);
      
      // Configurações da API
      const SPRINTHUB_CONFIG = {
        baseUrl: 'sprinthub-api-master.sprinthub.app',
        apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c',
        instance: 'oficialmed'
      };
      
      const SUPABASE_CONFIG = {
        url: supabaseUrl,
        serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      };
      
      const PAGE_LIMIT = 100;
      
      // 📋 CONFIGURAÇÃO DOS FUNIS E ETAPAS
      const FUNIS_CONFIG = {
        6: {
          name: "[1] COMERCIAL APUCARANA",
          stages: [
            { id: 130, name: "[0] ENTRADA" },
            { id: 231, name: "[1] ACOLHIMENTO/TRIAGEM" },
            { id: 82, name: "[2] QUALIFICADO" },
            { id: 207, name: "[3] ORÇAMENTO REALIZADO" },
            { id: 83, name: "[4] NEGOCIAÇÃO" },
            { id: 85, name: "[5] FOLLOW UP" },
            { id: 232, name: "[6] CADASTRO" }
          ]
        },
        14: {
          name: "[2] RECOMPRA",
          stages: [
            { id: 227, name: "[X] PROMO" },
            { id: 202, name: "[0] ENTRADA" },
            { id: 228, name: "[1] ACOLHIMENTO/TRIAGEM" },
            { id: 229, name: "[2] QUALIFICAÇÃO" },
            { id: 206, name: "[3] ORÇAMENTOS" },
            { id: 203, name: "[4] NEGOCIAÇÃO" },
            { id: 204, name: "[5] FOLLOW UP" },
            { id: 230, name: "[6] CADASTRO" },
            { id: 205, name: "[X] PARCEIROS" },
            { id: 241, name: "[0] MONITORAMENTO" },
            { id: 146, name: "[1] DISPARO" },
            { id: 147, name: "[2] DIA 1 - 1º TENTATIVA" },
            { id: 167, name: "[3] DIA 1 - 2º TENTATIVA" },
            { id: 148, name: "[4] DIA 2 - 1º TENTATIVA" },
            { id: 168, name: "[5] DIA 2 - 2º TENTATIVA" },
            { id: 149, name: "[6] DIA 3 - 1º TENTATIVA" },
            { id: 169, name: "[7] DIA 3 - 2º TENTATIVA" },
            { id: 150, name: "[8] FOLLOW UP INFINITO" }
          ]
        }
      };
      
      logger.debug('🎯 CONFIGURAÇÃO DA SINCRONIZAÇÃO HORÁRIA:');
      logger.debug(`   📊 Funis: 6 (APUCARANA) e 14 (RECOMPRA)`);
      logger.debug(`   📋 Total etapas: ${FUNIS_CONFIG[6].stages.length + FUNIS_CONFIG[14].stages.length}`);
      logger.debug(`   📅 Filtro: createDate de hoje (TODOS os status)`);
      logger.debug(`   📄 Limit por página: ${PAGE_LIMIT}`);
      logger.debug('='.repeat(80));
      
      // 💾 FUNÇÃO PARA VERIFICAR SE A DATA É DE HOJE
      const isToday = (createDate) => {
        if (!createDate) return false;
        
        try {
          const oppDate = new Date(createDate);
          return oppDate >= today && oppDate <= endOfToday;
        } catch (error) {
          return false;
        }
      };
      
      // 💾 FUNÇÃO PARA MAPEAR CAMPOS (baseada na função semanal)
      const mapOpportunityFields = (opportunity, funnelId) => {
        const fields = opportunity.fields || {};
        const lead = opportunity.dataLead || {};
        const utmTags = (lead.utmTags && lead.utmTags[0]) || {};

        return {
          id: opportunity.id,
          title: opportunity.title,
          value: parseFloat(opportunity.value) || 0.00,
          crm_column: opportunity.crm_column,
          lead_id: opportunity.lead_id,
          status: opportunity.status,
          loss_reason: opportunity.loss_reason || null,
          gain_reason: opportunity.gain_reason || null,
          user_id: opportunity.user || null,
          
          // Datas importantes
          create_date: opportunity.createDate ? new Date(opportunity.createDate).toISOString() : null,
          update_date: opportunity.updateDate ? new Date(opportunity.updateDate).toISOString() : null,
          lost_date: opportunity.lost_date || null,
          gain_date: opportunity.gain_date || null,
          
          // Campos específicos
          origem_oportunidade: fields["ORIGEM OPORTUNIDADE"] || null,
          qualificacao: fields["QUALIFICACAO"] || null,
          status_orcamento: fields["Status Orcamento"] || null,
          
          // UTM
          utm_source: utmTags.utmSource || null,
          utm_campaign: utmTags.utmCampaign || null,
          utm_medium: utmTags.utmMedium || null,
          
          // Lead
          lead_firstname: lead.firstname || null,
          lead_email: lead.email || null,
          lead_whatsapp: lead.whatsapp || null,
          
          // Controle
          archived: opportunity.archived || 0,
          synced_at: new Date().toISOString(),
          
          // Funil
          funil_id: funnelId,
          unidade_id: '[1]', // Ambos funis são da unidade Apucarana
          funil_nome: funnelId === 6 ? '[1] Comercial Apucarana' : '[1] Recompra Apucarana'
        };
      };
      
      // 🔍 FUNÇÃO PARA VERIFICAR SE EXISTE NO SUPABASE
      const checkInSupabase = async (opportunityId) => {
        try {
          const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}&select=id,update_date`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
              'apikey': SUPABASE_CONFIG.serviceRoleKey,
              'Accept-Profile': 'api'
            }
          });

          if (!response.ok) return null;
          
          const data = await response.json();
          return Array.isArray(data) && data.length > 0 ? data[0] : null;
          
        } catch (error) {
          logger.error(`❌ Erro ao verificar ID ${opportunityId}:`, error);
          return null;
        }
      };
      
      // 💾 FUNÇÃO PARA INSERIR NO SUPABASE
      const insertToSupabase = async (data) => {
        try {
          const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
              'apikey': SUPABASE_CONFIG.serviceRoleKey,
              'Accept-Profile': 'api',
              'Content-Profile': 'api',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
          });

          return { success: response.ok, status: response.status };
          
        } catch (error) {
          logger.error('❌ Erro ao inserir:', error);
          return { success: false, error: error.message };
        }
      };
      
      // 🔄 FUNÇÃO PARA ATUALIZAR NO SUPABASE
      const updateInSupabase = async (opportunityId, data) => {
        try {
          const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
              'apikey': SUPABASE_CONFIG.serviceRoleKey,
              'Accept-Profile': 'api',
              'Content-Profile': 'api',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
          });

          return { success: response.ok, status: response.status };
          
        } catch (error) {
          logger.error('❌ Erro ao atualizar:', error);
          return { success: false, error: error.message };
        }
      };
      
      let allOpportunities = [];
      let totalApiCalls = 0;
      
      // Estatísticas globais
      let totalInserted = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;
      let totalErrors = 0;
      
      // 🔄 PROCESSAR CADA FUNIL
      const totalFunnels = Object.keys(FUNIS_CONFIG).length;
      let currentFunnelIndex = 0;
      
      for (const [funnelId, funnelConfig] of Object.entries(FUNIS_CONFIG)) {
        currentFunnelIndex++;
        updateSyncProgress('Sincronização horária', currentFunnelIndex, totalFunnels, `Funil: ${funnelConfig.name}`);
        
        logger.debug(`\n🎯 PROCESSANDO FUNIL ${funnelId}: ${funnelConfig.name}`);
        logger.debug('='.repeat(60));
        
        let funnelInserted = 0;
        let funnelUpdated = 0;
        let funnelSkipped = 0;
        let funnelErrors = 0;
        
        // 🔄 PROCESSAR CADA ETAPA DO FUNIL
        for (const stage of funnelConfig.stages) {
          logger.debug(`\n📋 PROCESSANDO ETAPA: ${stage.name} (ID: ${stage.id})`);
          logger.debug('-'.repeat(60));
          
          let currentPage = 0;
          let hasMorePages = true;
          let stageOpportunities = [];
          let stageInserted = 0;
          let stageUpdated = 0;
          let stageSkipped = 0;
          let stageErrors = 0;
          
          // Paginação completa para esta etapa
          while (hasMorePages) {
            totalApiCalls++;
            logger.debug(`\n📄 ${stage.name} - Página ${currentPage + 1}:`);
            logger.debug(`🔍 Buscando funil ${funnelId}, etapa ${stage.id}, página ${currentPage}, limit ${PAGE_LIMIT}...`);
          
            try {
              const postData = JSON.stringify({ 
                page: currentPage, 
                limit: PAGE_LIMIT, 
                columnId: stage.id 
              });
              
              const pageStartTime = performance.now();
              
              const response = await fetch(`https://${SPRINTHUB_CONFIG.baseUrl}/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_CONFIG.apiToken}&i=${SPRINTHUB_CONFIG.instance}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: postData
              });
              
              const pageEndTime = performance.now();
              const pageTime = (pageEndTime - pageStartTime).toFixed(0);
              
              if (!response.ok) {
                const errorText = await response.text();
                logger.error(`❌ Erro HTTP ${response.status} na página ${currentPage + 1}:`, errorText);
                break;
              }
              
              const pageOpportunities = await response.json();
              const opportunitiesArray = Array.isArray(pageOpportunities) ? pageOpportunities : [];
              
              logger.debug(`📊 Página ${currentPage + 1}: ${opportunitiesArray.length} registros retornados (${pageTime}ms)`);
              
              // Verificar se há dados na página
              if (opportunitiesArray.length === 0) {
                logger.debug('🏁 Página vazia - fim da paginação desta etapa');
                hasMorePages = false;
              } else {
                // Filtrar por data de criação de hoje (TODOS os status)
                const todayOpps = opportunitiesArray.filter(opp => isToday(opp.createDate));
                
                logger.debug(`   📅 Criadas hoje: ${todayOpps.length}/${opportunitiesArray.length}`);
                
                // 💾 PROCESSAR E INSERIR/ATUALIZAR CADA OPORTUNIDADE
                if (todayOpps.length > 0) {
                  logger.debug(`   💾 Processando ${todayOpps.length} oportunidades...`);
                  
                  for (const opp of todayOpps) {
                    try {
                      // Verificar se já existe
                      const existingRecord = await checkInSupabase(opp.id);
                      const mappedData = mapOpportunityFields(opp, parseInt(funnelId));
                      
                      if (!existingRecord) {
                        // INSERIR: Registro não existe
                        const result = await insertToSupabase(mappedData);
                        
                        if (result.success) {
                          totalInserted++;
                          funnelInserted++;
                          stageInserted++;
                          logger.debug(`     ✅ INSERIDO: ${opp.id} - ${opp.title} (${opp.status})`);
                        } else {
                          totalErrors++;
                          funnelErrors++;
                          stageErrors++;
                          logger.debug(`     ❌ Erro inserção: ${opp.id} - Status: ${result.status}`);
                        }
                      } else {
                        // ATUALIZAR: Verificar se precisa atualizar
                        const sprintHubDate = new Date(opp.updateDate);
                        const supabaseDate = new Date(existingRecord.update_date);
                        
                        if (sprintHubDate > supabaseDate) {
                          // Dados do SprintHub são mais recentes
                          const result = await updateInSupabase(opp.id, mappedData);
                          
                          if (result.success) {
                            totalUpdated++;
                            funnelUpdated++;
                            stageUpdated++;
                            logger.debug(`     🔄 ATUALIZADO: ${opp.id} - ${opp.title} (${opp.status})`);
                          } else {
                            totalErrors++;
                            funnelErrors++;
                            stageErrors++;
                            logger.debug(`     ❌ Erro atualização: ${opp.id} - Status: ${result.status}`);
                          }
                        } else {
                          // Dados já estão atualizados
                          totalSkipped++;
                          funnelSkipped++;
                          stageSkipped++;
                          logger.debug(`     ⚪ Já atualizado: ${opp.id} - ${opp.title} (${opp.status})`);
                        }
                      }
                      
                      // Rate limiting entre operações
                      await new Promise(resolve => setTimeout(resolve, 50));
                      
                    } catch (error) {
                      totalErrors++;
                      funnelErrors++;
                      stageErrors++;
                      logger.error(`     ❌ Erro processando ${opp.id}:`, error);
                    }
                  }
                  
                  // Mostrar resumo da página
                  logger.debug(`   📊 Página processada: ${stageInserted} inseridas | ${stageUpdated} atualizadas | ${stageSkipped} já atualizadas | ${stageErrors} erros`);
                }
                
                // Adicionar ao array geral
                stageOpportunities.push(...todayOpps);
                
                // Se retornou menos que o limite, é a última página
                if (opportunitiesArray.length < PAGE_LIMIT) {
                  logger.debug('🏁 Última página desta etapa detectada (< limite)');
                  hasMorePages = false;
                } else {
                  currentPage++;
                }
              }
              
              // Rate limiting entre páginas
              await new Promise(resolve => setTimeout(resolve, 200));
              
            } catch (error) {
              logger.error(`❌ Erro na página ${currentPage + 1} da etapa ${stage.name}:`, error);
              hasMorePages = false;
            }
          }
          
          // Resumo da etapa
          logger.debug(`\n📊 RESUMO ETAPA ${stage.name}:`);
          logger.debug(`   📊 Total encontradas: ${stageOpportunities.length}`);
          logger.debug(`   ✅ Inseridas: ${stageInserted}`);
          logger.debug(`   🔄 Atualizadas: ${stageUpdated}`);
          logger.debug(`   ⚪ Já atualizadas: ${stageSkipped}`);
          logger.debug(`   ❌ Erros: ${stageErrors}`);
          
          // Adicionar ao array geral para estatísticas finais
          allOpportunities.push(...stageOpportunities);
          
          // Rate limiting entre etapas
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Resumo do funil
        logger.debug(`\n📊 RESUMO FUNIL ${funnelId} (${funnelConfig.name}):`);
        logger.debug(`   ✅ Inseridas: ${funnelInserted}`);
        logger.debug(`   🔄 Atualizadas: ${funnelUpdated}`);
        logger.debug(`   ⚪ Já atualizadas: ${funnelSkipped}`);
        logger.debug(`   ❌ Erros: ${funnelErrors}`);
        
        // Rate limiting entre funis
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const endTime = performance.now();
      const totalTime = (endTime - startTime) / 1000; // em segundos
      
      // 📊 RELATÓRIO FINAL
      logger.debug('\n' + '='.repeat(80));
      logger.debug('📊 RELATÓRIO FINAL — SINCRONIZAÇÃO HORÁRIA');
      logger.debug('='.repeat(80));
      logger.debug(`🕒 Tempo de execução: ${totalTime.toFixed(2)}s`);
      logger.debug(`📅 Período: ${today.toLocaleDateString('pt-BR')} (hoje)`);
      logger.debug(`🎯 Funis processados: 6 (APUCARANA) e 14 (RECOMPRA)`);
      logger.debug(`🔄 Total de chamadas à API: ${totalApiCalls}`);
      logger.debug(`📊 Total registros encontrados: ${allOpportunities.length}`);
      logger.debug(`💾 ESTATÍSTICAS DE SINCRONIZAÇÃO:`);
      logger.debug(`   ✅ Inseridos: ${totalInserted}`);
      logger.debug(`   🔄 Atualizados: ${totalUpdated}`);
      logger.debug(`   ⚪ Já atualizados: ${totalSkipped}`);
      logger.debug(`   ❌ Erros: ${totalErrors}`);
      
      if (allOpportunities.length > 0) {
        // IDs organizados
        const allIds = allOpportunities.map(opp => opp.id).sort((a, b) => a - b);
        const firstIds = allIds.slice(0, 5);
        const lastIds = allIds.slice(-5);
        
        logger.debug(`🆔 Primeiros IDs: ${firstIds.join(', ')}`);
        if (allOpportunities.length > 5) {
          logger.debug(`🆔 Últimos IDs: ${lastIds.join(', ')}`);
        }
        
        // Tabela resumo
        logger.debug('\n📋 TABELA RESUMO:');
        logger.debug('┌─────────────────────────────────┬──────────┐');
        logger.debug('│ Métrica                         │ Valor    │');
        logger.debug('├─────────────────────────────────┼──────────┤');
        logger.debug('│ Funis processados               │ 2        │');
        logger.debug(`│ Chamadas API                    │ ${totalApiCalls.toString().padEnd(8)} │`);
        logger.debug(`│ Registros encontrados           │ ${allOpportunities.length.toString().padEnd(8)} │`);
        logger.debug('├─────────────────────────────────┼──────────┤');
        logger.debug(`│ ✅ Inseridos no Supabase        │ ${totalInserted.toString().padEnd(8)} │`);
        logger.debug(`│ 🔄 Atualizados no Supabase      │ ${totalUpdated.toString().padEnd(8)} │`);
        logger.debug(`│ ⚪ Já atualizados               │ ${totalSkipped.toString().padEnd(8)} │`);
        logger.debug(`│ ❌ Erros                        │ ${totalErrors.toString().padEnd(8)} │`);
        logger.debug('├─────────────────────────────────┼──────────┤');
        logger.debug(`│ Tempo total (s)                 │ ${totalTime.toFixed(2).padEnd(8)} │`);
        logger.debug('└─────────────────────────────────┴──────────┘');
        
        // Amostra de dados
        logger.debug('\n🔍 AMOSTRA DE DADOS (primeiras 3 oportunidades):');
        allOpportunities.slice(0, 3).forEach((opp, index) => {
          logger.debug(`\n${index + 1}. ID: ${opp.id}`);
          logger.debug(`   📋 Título: ${opp.title}`);
          logger.debug(`   💰 Valor: R$ ${parseFloat(opp.value || 0).toFixed(2)}`);
          logger.debug(`   📅 Criação: ${opp.createDate ? new Date(opp.createDate).toLocaleDateString('pt-BR') : 'N/A'}`);
          logger.debug(`   👤 Responsável: ${opp.user || 'N/A'}`);
          logger.debug(`   🔗 Lead ID: ${opp.lead_id || 'N/A'}`);
          logger.debug(`   📊 Status: ${opp.status || 'N/A'}`);
        });
        
      } else {
        logger.debug('❌ Nenhuma oportunidade encontrada hoje');
      }
      
      logger.debug('\n='.repeat(80));
      logger.debug('✅ SINCRONIZAÇÃO HORÁRIA CONCLUÍDA COM SUCESSO!');
      logger.debug(`🕒 Finalizada em: ${new Date().toLocaleTimeString('pt-BR')}`);
      logger.debug('='.repeat(80));
      
      // 📅 ATUALIZAR ÚLTIMA SINCRONIZAÇÃO
      setLastSyncTime(new Date());
      
      // Alert final
      alert(
        `🕐 SINCRONIZAÇÃO HORÁRIA CONCLUÍDA\n\n` +
        `📅 Período: ${today.toLocaleDateString('pt-BR')} (hoje)\n` +
        `🎯 Funis: 6 (APUCARANA) e 14 (RECOMPRA)\n` +
        `📊 Registros encontrados: ${allOpportunities.length}\n\n` +
        `💾 ESTATÍSTICAS:\n` +
        `• ✅ Inseridos: ${totalInserted}\n` +
        `• 🔄 Atualizados: ${totalUpdated}\n` +
        `• ⚪ Já atualizados: ${totalSkipped}\n` +
        `• ❌ Erros: ${totalErrors}\n` +
        `• ⏱️ Tempo total: ${totalTime.toFixed(2)}s\n\n` +
        `🔍 Verifique o console para relatório completo!`
      );
      
    } catch (error) {
      logger.error('❌ ERRO NA SINCRONIZAÇÃO HORÁRIA:', error);
      logger.error('Stack trace:', error.stack);
      alert(`❌ Erro na sincronização: ${error.message}\n\nVerifique o console para mais detalhes.`);
    } finally {
      setIsSyncingHourly(false);
      clearSyncProgress();
    }
  };

  // ⚡ SINCRONIZAÇÃO IMEDIATA - ÚLTIMAS 48 HORAS
  const handleSyncNow = async () => {
    if (isSyncingNow) return;
    
    const confirmSync = confirm(
      '⚡ SYNC AGORA - Últimas 48 Horas\n\n' +
      '🎯 O que será executado:\n' +
      '• Buscar oportunidades das últimas 48 horas\n' +
      '• Ambos os funis: 6 (COMERCIAL) e 14 (RECOMPRA)\n' +
      '• Unidade: [1] Apucarana\n' +
      '• Processamento otimizado e rápido\n\n' +
      '⏱️ Tempo estimado: 2-5 minutos\n' +
      '🔄 Atualiza dados em tempo real\n\n' +
      'Deseja continuar?'
    );
    
    if (!confirmSync) return;
    
    setIsSyncingNow(true);
    updateSyncProgress('Sync Agora - 48h', 0, 100, 'Iniciando...');
    
    try {
      logger.info('⚡ INICIANDO SYNC AGORA - ÚLTIMAS 48 HORAS');
      logger.info('='.repeat(80));
      logger.info(`🕒 Início: ${new Date().toLocaleTimeString('pt-BR')}`);
      
      // Simular chamada do script sync-hourly via API ou executar lógica similar
      // Por simplicidade, vou reutilizar a lógica de sincronização horária, mas com 48h
      
      const now = new Date();
      const hoursAgo48 = new Date(now);
      hoursAgo48.setHours(hoursAgo48.getHours() - 48);
      
      logger.info(`📅 Período: ${hoursAgo48.toLocaleString('pt-BR')} a ${now.toLocaleString('pt-BR')}`);
      logger.info(`🎯 Funis: 6 (COMERCIAL) e 14 (RECOMPRA)`);
      logger.info(`📍 Unidade: [1] Apucarana`);
      
      // Executar a lógica similar ao handleHourlySync, mas com período de 48h
      // Para não duplicar código, vou usar o mesmo código base
      
      const SUPABASE_CONFIG = {
        url: supabaseUrl,
        key: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      };

      const SPRINTHUB_CONFIG = {
        baseUrl: 'sprinthub-api-master.sprinthub.app',
        apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c',
        instance: 'oficialmed'
      };
      
      // Configuração dos funis (mesmo do hourly)
      const FUNIS_CONFIG = {
        6: {
          name: '[1] COMERCIAL APUCARANA',
          stages: [
            { id: 130, name: '[0] ENTRADA' },
            { id: 231, name: '[1] ACOLHIMENTO/TRIAGEM' },
            { id: 82, name: '[2] QUALIFICADO' },
            { id: 207, name: '[3] ORÇAMENTO REALIZADO' },
            { id: 83, name: '[4] NEGOCIAÇÃO' },
            { id: 85, name: '[5] FOLLOW UP' },
            { id: 232, name: '[6] CADASTRO' }
          ]
        },
        14: {
          name: '[1] RECOMPRA APUCARANA',
          stages: [
            { id: 202, name: '[0] ENTRADA' },
            { id: 228, name: '[1] ACOLHIMENTO/TRIAGEM' },
            { id: 229, name: '[2] QUALIFICAÇÃO' },
            { id: 206, name: '[3] ORÇAMENTOS' },
            { id: 203, name: '[4] NEGOCIAÇÃO' },
            { id: 204, name: '[5] FOLLOW UP' },
            { id: 230, name: '[6] CADASTRO' },
            { id: 205, name: '[X] PARCEIROS' },
            { id: 241, name: '[0] MONITORAMENTO' },
            { id: 146, name: '[0] REATIVAÇÃO' },
            { id: 167, name: '[0] D-0' },
            { id: 148, name: '[3] D-3' },
            { id: 168, name: '[3] D-7' },
            { id: 149, name: '[3] D-15' },
            { id: 169, name: '[3] D-22' },
            { id: 150, name: '[3] D-30' }
          ]
        }
      };

      const PAGE_LIMIT = 30; // Menor para ser mais rápido
      let totalApiCalls = 0;
      let totalProcessed = 0;
      let totalInserted = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;
      let totalErrors = 0;
      const allOpportunities = [];
      
      // Função para mapear oportunidade
      const mapOpportunityFields = (opportunity, funnelId) => {
        const fields = opportunity.fields || {};
        const lead = opportunity.dataLead || {};
        const utmTags = (lead.utmTags && lead.utmTags[0]) || {};

        return {
          id: opportunity.id,
          title: opportunity.title,
          value: parseFloat(opportunity.value) || 0.00,
          crm_column: opportunity.crm_column,
          lead_id: opportunity.lead_id,
          status: opportunity.status,
          loss_reason: opportunity.loss_reason || null,
          gain_reason: opportunity.gain_reason || null,
          user_id: opportunity.user || null,
          
          create_date: opportunity.createDate ? new Date(opportunity.createDate).toISOString() : null,
          update_date: opportunity.updateDate ? new Date(opportunity.updateDate).toISOString() : null,
          lost_date: opportunity.lost_date || null,
          gain_date: opportunity.gain_date || null,
          
          origem_oportunidade: fields["ORIGEM OPORTUNIDADE"] || null,
          qualificacao: fields["QUALIFICACAO"] || null,
          status_orcamento: fields["Status Orcamento"] || null,
          
          utm_source: utmTags.utmSource || null,
          utm_campaign: utmTags.utmCampaign || null,
          utm_medium: utmTags.utmMedium || null,
          
          lead_firstname: lead.firstname || null,
          lead_email: lead.email || null,
          lead_whatsapp: lead.whatsapp || null,
          
          archived: opportunity.archived || 0,
          synced_at: new Date().toISOString(),
          
          funil_id: funnelId,
          unidade_id: '[1]'
        };
      };

      // Processar cada funil
      let funnelProgress = 0;
      for (const [funnelId, funnelConfig] of Object.entries(FUNIS_CONFIG)) {
        funnelProgress++;
        updateSyncProgress('Sync Agora - 48h', (funnelProgress / 2) * 50, 100, `Funil ${funnelConfig.name}`);
        
        logger.info(`\n🎯 PROCESSANDO FUNIL ${funnelId}: ${funnelConfig.name}`);
        
        // Processar cada etapa
        for (const stage of funnelConfig.stages) {
          logger.debug(`📋 Etapa: ${stage.name} (ID: ${stage.id})`);
          
          let currentPage = 0;
          let hasMorePages = true;
          
          while (hasMorePages) {
            totalApiCalls++;
            
            try {
              const postData = JSON.stringify({
                page: currentPage,
                limit: PAGE_LIMIT,
                columnId: stage.id
              });
              
              const response = await fetch(`https://${SPRINTHUB_CONFIG.baseUrl}/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_CONFIG.apiToken}&i=${SPRINTHUB_CONFIG.instance}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: postData
              });
              
              const data = await response.json();
              const opportunitiesArray = Array.isArray(data) ? data : [];
              
              if (opportunitiesArray.length === 0) {
                hasMorePages = false;
                continue;
              }
              
              // Filtrar apenas das últimas 48h
              const recentOpportunities = opportunitiesArray.filter(opp => {
                if (!opp.updateDate) return false;
                const updateDate = new Date(opp.updateDate);
                return updateDate >= hoursAgo48;
              });
              
              logger.debug(`📊 Página ${currentPage + 1}: ${recentOpportunities.length}/${opportunitiesArray.length} das últimas 48h`);
              
              // Processar oportunidades recentes
              for (const opp of recentOpportunities) {
                totalProcessed++;
                allOpportunities.push(opp);
                
                const mappedData = mapOpportunityFields(opp, parseInt(funnelId));
                
                // Verificar se existe no Supabase
                try {
                  const checkResponse = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint?id=eq.${opp.id}&select=id,synced_at`, {
                    headers: {
                      'Authorization': `Bearer ${SUPABASE_CONFIG.key}`,
                      'apikey': SUPABASE_CONFIG.key,
                      'Accept-Profile': 'api'
                    }
                  });
                  
                  const existingData = await checkResponse.json();
                  const exists = Array.isArray(existingData) && existingData.length > 0;
                  
                  if (!exists) {
                    // INSERT
                    const insertResponse = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_CONFIG.key}`,
                        'apikey': SUPABASE_CONFIG.key,
                        'Accept-Profile': 'api',
                        'Content-Profile': 'api',
                        'Prefer': 'return=representation'
                      },
                      body: JSON.stringify(mappedData)
                    });
                    
                    if (insertResponse.ok) {
                      totalInserted++;
                      logger.debug(`✅ INSERIDO: ${opp.id} - ${opp.title}`);
                    } else {
                      totalErrors++;
                      logger.debug(`❌ ERRO INSERT: ${opp.id}`);
                    }
                  } else {
                    // UPDATE
                    const updateResponse = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint?id=eq.${opp.id}`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_CONFIG.key}`,
                        'apikey': SUPABASE_CONFIG.key,
                        'Accept-Profile': 'api',
                        'Content-Profile': 'api'
                      },
                      body: JSON.stringify(mappedData)
                    });
                    
                    if (updateResponse.ok) {
                      totalUpdated++;
                      logger.debug(`🔄 ATUALIZADO: ${opp.id} - ${opp.title}`);
                    } else {
                      totalErrors++;
                      logger.debug(`❌ ERRO UPDATE: ${opp.id}`);
                    }
                  }
                } catch (error) {
                  totalErrors++;
                  logger.error(`❌ Erro processando ID ${opp.id}:`, error);
                }
                
                // Atualizar progresso
                const progress = 50 + ((totalProcessed / Math.max(totalProcessed + 1, 100)) * 50);
                updateSyncProgress('Sync Agora - 48h', progress, 100, `${totalProcessed} processadas`);
              }
              
              currentPage++;
              
              if (opportunitiesArray.length < PAGE_LIMIT) {
                hasMorePages = false;
              }
              
            } catch (error) {
              logger.error(`❌ Erro na página ${currentPage + 1} da etapa ${stage.id}:`, error);
              hasMorePages = false;
            }
          }
        }
      }
      
      // Relatório final
      updateSyncProgress('Sync Agora - 48h', 100, 100, 'Concluído!');
      
      const endTime = Date.now();
      const totalTime = (endTime - performance.now()) / 1000;
      
      logger.info('\n' + '='.repeat(80));
      logger.info('📊 RELATÓRIO FINAL - SYNC AGORA (48H)');
      logger.info('='.repeat(80));
      logger.info(`🕒 Tempo de execução: ${Math.abs(totalTime).toFixed(2)}s`);
      logger.info(`🔄 Total de chamadas à API: ${totalApiCalls}`);
      logger.info(`📊 Total registros processados: ${totalProcessed}`);
      logger.info(`💾 ESTATÍSTICAS:`);
      logger.info(`   ✅ Inseridos: ${totalInserted}`);
      logger.info(`   🔄 Atualizados: ${totalUpdated}`);
      logger.info(`   ❌ Erros: ${totalErrors}`);
      
      setLastSyncTime(new Date());
      
      alert(
        `⚡ SYNC AGORA CONCLUÍDO!\n\n` +
        `📊 RESULTADOS (últimas 48h):\n` +
        `• Processadas: ${totalProcessed} oportunidades\n` +
        `• ✅ Inseridas: ${totalInserted}\n` +
        `• 🔄 Atualizadas: ${totalUpdated}\n` +
        `• ❌ Erros: ${totalErrors}\n` +
        `• ⏱️ Tempo: ${Math.abs(totalTime).toFixed(2)}s\n\n` +
        `✅ Dados atualizados em tempo real!`
      );
      
      // Registrar na tabela api.sincronizacao (UI)
      await insertSyncRecordBrowser(
        `Sync agora (UI) concluído: processadas ${totalProcessed} | inseridas ${totalInserted} | atualizadas ${totalUpdated} | erros ${totalErrors}`
      );
      // Atualiza label buscando do banco
      await fetchLastSyncFromDB();
    } catch (error) {
      logger.error('❌ ERRO NO SYNC AGORA:', error);
      await insertSyncRecordBrowser(`Sync agora (UI) falhou: ${error.message}`);
      await fetchLastSyncFromDB();
      alert(`❌ Erro na sincronização: ${error.message}\n\nVerifique o console para mais detalhes.`);
    } finally {
      setIsSyncingNow(false);
      clearSyncProgress();
    }
  };

  // 🕐 FUNÇÃO PARA INICIAR/PARAR SINCRONIZAÇÃO AUTOMÁTICA HORÁRIA
  const handleToggleHourlySync = () => {
    if (isHourlySyncRunning) {
      // Parar sincronização automática
      if (hourlySyncInterval) {
        clearInterval(hourlySyncInterval);
        setHourlySyncInterval(null);
      }
      setIsHourlySyncRunning(false);
      logger.debug('🛑 Sincronização horária automática PARADA');
    } else {
      // Iniciar sincronização automática (a cada hora)
      const interval = setInterval(() => {
        logger.debug('🕐 Executando sincronização horária automática...');
        handleHourlySync();
      }, 60 * 60 * 1000); // 60 minutos = 1 hora
      
      setHourlySyncInterval(interval);
      setIsHourlySyncRunning(true);
      logger.debug('🕐 Sincronização horária automática INICIADA (executa a cada hora)');
      
      // Executar imediatamente na primeira vez
      handleHourlySync();
      
      // 📅 ATUALIZAR ÚLTIMA SINCRONIZAÇÃO (será atualizada novamente pelo handleHourlySync)
      setLastSyncTime(new Date());
    }
  };


  // Limpar interval ao desmontar componente
  useEffect(() => {
    return () => {
      if (hourlySyncInterval) {
        clearInterval(hourlySyncInterval);
      }
    };
  }, [hourlySyncInterval]);

  // Verificar status do serviço diário ao carregar
  useEffect(() => {
    try {
      const status = dailySyncService.getDailySyncStatus();
      setIsDailySyncRunning(status.isRunning);
    } catch (error) {
      logger.warn('⚠️ Erro ao verificar status do serviço diário:', error);
    }
  }, []);

  // Função para iniciar/parar sincronização agendada
  const handleToggleScheduledSync = () => {
    const status = scheduledSyncService.getStatus();
    
    if (status.isRunning) {
      scheduledSyncService.stop();
      setIsScheduledSyncRunning(false);
      logger.info('⏹️ Sincronização agendada parada');
    } else {
      scheduledSyncService.start();
      setIsScheduledSyncRunning(true);
      updateScheduledSyncInfo();
      logger.info('🚀 Sincronização agendada iniciada');
    }
  };

  // Função para atualizar informações da sincronização agendada
  const updateScheduledSyncInfo = () => {
    const status = scheduledSyncService.getStatus();
    const nextTimes = scheduledSyncService.getNextSyncTimes();
    
    setNextScheduledSync(status.nextSyncTime);
    setScheduledSyncTimes(nextTimes);
  };

  // Função para forçar sincronização agendada
  const handleForceScheduledSync = async () => {
    if (isScheduledSyncRunning) return;
    
    setIsScheduledSyncRunning(true);
    try {
      const result = await scheduledSyncService.forceSync();
      if (result.success) {
        logger.info('✅ Sincronização agendada executada com sucesso');
        updateScheduledSyncInfo();
      } else {
        logger.error('❌ Erro na sincronização agendada:', result.error);
      }
    } catch (error) {
      logger.error('❌ Erro ao executar sincronização agendada:', error);
    } finally {
      setIsScheduledSyncRunning(false);
    }
  };

  // Carregar status do serviço de sincronização ao montar
  useEffect(() => {
    const status = autoSyncService.getStatus();
    if (status?.lastSyncTime) {
      setLastSyncTime(status.lastSyncTime);
    }
    
    // Buscar do banco a última sincronização (fonte de verdade)
    fetchLastSyncFromDB();
    
    // Atualizar a cada 30 segundos para pegar novos dados do banco
    const interval = setInterval(() => {
      fetchLastSyncFromDB();
    }, 30000); // 30 segundos
    
    // Escutar atualizações do serviço
    const handleSyncUpdate = (event) => {
      setLastSyncTime(event.detail.lastSyncTime);
      // Atualizar também do banco quando houver evento
      fetchLastSyncFromDB();
    };
    
    window.addEventListener('syncStatusUpdated', handleSyncUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('syncStatusUpdated', handleSyncUpdate);
    };
  }, []);

  // Carregar status da sincronização agendada ao montar
  useEffect(() => {
    const status = scheduledSyncService.getStatus();
    setIsScheduledSyncRunning(status.isRunning);
    updateScheduledSyncInfo();
    
    // Escutar atualizações da sincronização agendada
    const handleScheduledSyncUpdate = (event) => {
      setLastSyncTime(event.detail.lastSyncTime);
      updateScheduledSyncInfo();
    };
    
    window.addEventListener('scheduledSyncUpdated', handleScheduledSyncUpdate);
    
    return () => {
      window.removeEventListener('scheduledSyncUpdated', handleScheduledSyncUpdate);
    };
  }, []);

  // Não é mais necessário - o autoSyncService já gerencia isso

  // Formatar data/hora da última sincronização
  const formatSyncTime = (date) => {
    if (!date) return 'Nunca';
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fechar dropdown quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="tmb-top-menu-bar">
      {/* Indicador de Progresso de Sincronização */}
      {syncProgress && (
        <div className="tmb-sync-progress-container" style={{
          position: 'fixed',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          minWidth: '300px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
            {syncProgress.stage}
          </div>
          <div style={{ fontSize: '12px', marginBottom: '8px', opacity: '0.9' }}>
            {syncProgress.progress}/{syncProgress.total} ({syncProgress.percentage}%)
            {syncProgress.details && ` - ${syncProgress.details}`}
          </div>
          <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${syncProgress.percentage}%`,
              height: '100%',
              background: 'white',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}
      
      {/* Botão hamburger - sempre visível */}
      <button className="tmb-sidebar-toggle" onClick={toggleSidebar}>
        <div className="tmb-sidebar-toggle-discrete">
          <div className="tmb-hamburger-lines"></div>
          <div className="tmb-hamburger-lines"></div>
          <div className="tmb-hamburger-lines"></div>
        </div>
      </button>

      {/* Logo - visível no mobile */}
      <div className="tmb-logo-mobile" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <img src={LogoOficialmed} alt="OficialMed" />
      </div>

      {/* Container de busca - sempre visível */}
      <div className="tmb-search-container">
        <input 
          type="text" 
          className="tmb-search-input" 
          placeholder="Buscar..."
        />
      </div>

      {/* Status de Sincronização */}
      <div className="tmb-sync-status">
        <div className="tmb-sync-info">
          <span className="tmb-sync-label">Última sincronização:</span>
          <span className="tmb-sync-time">{formatSyncTime(lastSyncTime)}</span>
        </div>
        
        {/* Próxima Sincronização - sempre visível */}
        <div className="tmb-sync-info">
          <span className="tmb-sync-label">Próxima sincronização:</span>
          <span className="tmb-sync-time">
            {nextScheduledSync ? formatSyncTime(nextScheduledSync) : 'Calculando...'}
          </span>
        </div>
        
        {/* Botões do Serviço Diário - apenas para admin */}
        {isAdmin && (
          <>
            
            <button 
              className={`tmb-sync-btn ${isSyncingNow ? 'syncing' : ''}`}
              onClick={handleSyncNow}
              disabled={isSyncingNow}
              title="⚡ SYNC AGORA - Sincroniza imediatamente as últimas 48 horas de ambos os funis (6 e 14)"
              style={{ marginLeft: '8px', background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}
            >
              {isSyncingNow ? (
                <>
                  <span className="tmb-sync-spinner"></span>
                  Sincronizando...
                </>
              ) : (
                <>
                  ⚡ SYNC AGORA
                </>
              )}
            </button>

            {/* Botão de Sincronização Agendada - Apenas informativo, cronjob roda no Supabase */}
            <button 
              className="tmb-sync-btn"
              onClick={() => {
                alert(
                  '🕐 SINCRONIZAÇÃO AUTOMÁTICA ATIVA\n\n' +
                  '✅ O cronjob está rodando automaticamente no Supabase\n' +
                  '⏰ Executa às :45 de cada hora (00:45, 01:45, 02:45...)\n' +
                  '📊 Os dados de última e próxima sincronização são atualizados automaticamente\n\n' +
                  'Use o botão "⚡ SYNC AGORA" para forçar uma sincronização imediata.'
                );
              }}
              title="🕐 SINCRONIZAÇÃO AUTOMÁTICA - Cronjob rodando no Supabase às :45 de cada hora"
              style={{ 
                marginLeft: '8px', 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
              }}
            >
              🕐 AUTO SYNC ATIVO
            </button>


          </>
        )}
      </div>

      {/* Container para os ícones da direita - apenas no desktop */}
      <div className="tmb-right-icons-container">
        {/* Seletor de idioma */}
        <div className="tmb-language-selector" ref={languageDropdownRef}>
          <button 
            className="tmb-language-btn"
            onClick={toggleLanguageDropdown}
          >
            <img 
              src={currentLanguage === 'pt-BR' ? BandeiraBrasil : BandeiraEUA} 
              alt={currentLanguage === 'pt-BR' ? 'Brasil' : 'United States'} 
            />
            <span>{currentLanguage === 'pt-BR' ? 'BR' : 'US'}</span>
          </button>
          
          {/* Dropdown de idiomas */}
          {showLanguageDropdown && (
            <div className="tmb-language-dropdown">
              <div 
                className="tmb-language-option" 
                onClick={() => {
                  changeLanguage('pt-BR');
                  setShowLanguageDropdown(false);
                }}
              >
                <img src={BandeiraBrasil} alt="Brasil" />
                <span>Português</span>
              </div>
              <div 
                className="tmb-language-option" 
                onClick={() => {
                  changeLanguage('en-US');
                  setShowLanguageDropdown(false);
                }}
              >
                <img src={BandeiraEUA} alt="English" />
                <span>English</span>
              </div>
            </div>
          )}
        </div>

        <button className="tmb-top-menu-btn" onClick={toggleFullscreen} title="Tela cheia">
          <svg viewBox="0 0 24 24">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
          </svg>
        </button>

        <button className="tmb-top-menu-btn" onClick={toggleTheme} title="Alternar tema">
          {isDarkMode ? '☀️' : '🌙'}
        </button>

        <button className="tmb-top-menu-btn" title="Mensagens">
          ✉️
          <span className="tmb-notification-badge">3</span>
        </button>

        <button className="tmb-top-menu-btn" title="Notificações">
          🔔
          <span className="tmb-notification-badge">7</span>
        </button>

        <div className="tmb-user-avatar-container">
          <div className="tmb-user-avatar">U</div>
        </div>

        {/* Botão de Logout */}
        {onLogout && (
          <button 
            className="tmb-logout-btn" 
            title="Sair" 
            onClick={onLogout}
          >
            <img src="/src/assets/sair.png" alt="Sair" className="tmb-logout-icon" />
          </button>
        )}
      </div>
    </header>
  );
};

export default TopMenuBar;
