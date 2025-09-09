import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { syncFollowUpStage, checkFollowUpSync } from '../service/sprintHubSyncService';
import { testFunilSpecific, testFunilSpecificWithUnit } from '../service/totalOportunidadesService';
import autoSyncService from '../service/autoSyncService';
// Imports temporariamente removidos - arquivos não existem no repositório
// import { generateDuplicateReport, performFullCleanup } from '../service/duplicateCleanupService';
// import { syncTodayOnly, syncAll, checkFullSync } from '../service/unifiedSyncService';
// import todaySyncService from '../service/todaySyncService';
// import detacorretaIncremental from '../service/detacorreta_incremental';
import dailySyncService from '../service/dailySyncService';
import './TopMenuBar.css';

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
  const [isDailySyncRunning, setIsDailySyncRunning] = useState(false);
  const [isTestingDailySync, setIsTestingDailySync] = useState(false);
  const [isTestingAllOpen, setIsTestingAllOpen] = useState(false);
  const [isSyncingWeekly, setIsSyncingWeekly] = useState(false);
  const [isSyncingHourly, setIsSyncingHourly] = useState(false);
  const [isHourlySyncRunning, setIsHourlySyncRunning] = useState(false);
  const [hourlySyncInterval, setHourlySyncInterval] = useState(null);
  const languageDropdownRef = useRef(null);
  
  // Verificar se é admin (temporário - baseado nas credenciais fixas)
  const isAdmin = true; // Por enquanto sempre admin, depois implementar lógica real

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
      console.error('❌ Erro na sincronização manual:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Função para debugar datas do SprintHub
  const handleDebugDates = async () => {
    if (isSyncingToday) return;
    
    setIsSyncingToday(true);
    console.log('🔍 DEBUGANDO DATAS DO SPRINTHUB - 5 OPORTUNIDADES');
    console.log('='.repeat(60));
    
    try {
      const SPRINTHUB_URL = 'https://sprinthub-api-master.sprinthub.app';
      const API_TOKEN = '9ad36c85-5858-4960-9935-e73c3698dd0c';
      const INSTANCE = 'oficialmed';
      
      // Buscar da primeira etapa do funil 6 (entrada)
      const postData = JSON.stringify({ page: 0, limit: 10, columnId: 130 });
      
      const response = await fetch(`${SPRINTHUB_URL}/crm/opportunities/6?apitoken=${API_TOKEN}&i=${INSTANCE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: postData
      });
      
      const allOpportunities = await response.json();
      
      console.log(`📊 Total oportunidades da etapa 232: ${allOpportunities.length}`);
      
      // Debug: mostrar JSON completo da primeira oportunidade
      if (allOpportunities.length > 0) {
        console.log('🔍 JSON COMPLETO DA PRIMEIRA OPORTUNIDADE:');
        console.log(JSON.stringify(allOpportunities[0], null, 2));
        console.log('🔍 CAMPOS DISPONÍVEIS:');
        console.log(Object.keys(allOpportunities[0]));
      }
      console.log('📅 Comparando datas:');
      
      const today = new Date();
      console.log('Data hoje JavaScript:', today.toDateString());
      console.log('Data hoje ISO:', today.toISOString().split('T')[0]);
      
      let todayCount = 0;
      
      opportunities.slice(0, 5).forEach((opp, index) => {
        console.log(`\n[${index + 1}] ID: ${opp.id} - ${opp.title}`);
        console.log(`  📅 createDate (bruto):`, opp.createDate);
        
        if (opp.createDate) {
          const oppDate = new Date(opp.createDate);
          console.log(`  📅 createDate (JS Date):`, oppDate);
          console.log(`  📅 createDate (toDateString):`, oppDate.toDateString());
          console.log(`  📅 createDate (ISO):`, oppDate.toISOString().split('T')[0]);
          
          // Testar diferentes comparações
          const isToday1 = oppDate.toDateString() === today.toDateString();
          const isToday2 = oppDate.toISOString().split('T')[0] === today.toISOString().split('T')[0];
          
          console.log(`  ✅ É hoje? (toDateString): ${isToday1}`);
          console.log(`  ✅ É hoje? (ISO): ${isToday2}`);
          
          if (isToday1 || isToday2) todayCount++;
        } else {
          console.log(`  ❌ createDate é null/undefined`);
        }
      });
      
      console.log(`\n📊 RESUMO: ${todayCount} das 5 oportunidades são de hoje`);
      alert(`Debug concluído! Verifique o console.\n${todayCount} das 5 oportunidades são de hoje.`);
      
    } catch (error) {
      console.error('❌ Erro:', error);
      alert('Erro no debug. Verifique o console.');
    } finally {
      setIsSyncingToday(false);
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
      console.log('🔄 SINCRONIZANDO ETAPA CADASTRO - CRIADAS HOJE...');
      
      // Configurações
      const SPRINTHUB_URL = 'https://sprinthub-api-master.sprinthub.app';
      const API_TOKEN = '9ad36c85-5858-4960-9935-e73c3698dd0c';
      const INSTANCE = 'oficialmed';
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      
      // 1. Buscar oportunidades da etapa CADASTRO (232)
      console.log('🔍 1. Buscando etapa CADASTRO...');
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
      console.log(`📊 Total na etapa CADASTRO: ${allOpportunities.length}`);
      
      // 2. Filtrar APENAS as CRIADAS hoje
      console.log('🔍 2. Filtrando por createDate = hoje...');
      const today = new Date().toLocaleDateString('pt-BR'); // DD/MM/YYYY
      console.log(`📅 Data de hoje: ${today}`);
      
      const todayOpportunities = allOpportunities.filter(opp => {
        if (!opp.createDate) {
          return false;
        }
        
        // Converter data ISO para data brasileira
        const createDate = new Date(opp.createDate);
        const createDateBR = createDate.toLocaleDateString('pt-BR'); // DD/MM/YYYY
        const isToday = createDateBR === today;
        
        console.log(`   📅 ID ${opp.id}: createDate="${opp.createDate}" -> "${createDateBR}" === "${today}" = ${isToday ? '✅' : '❌'}`);
        
        return isToday;
      });
      
      console.log(`📊 RESULTADO FILTRO: ${todayOpportunities.length} oportunidades criadas hoje`);
      
      if (todayOpportunities.length === 0) {
        alert('✅ Nenhuma oportunidade criada hoje na etapa CADASTRO');
        return;
      }
      
      // 3. Mostrar quais foram encontradas
      console.log('📋 OPORTUNIDADES CRIADAS HOJE:');
      todayOpportunities.forEach((opp, index) => {
        console.log(`   ${index + 1}. ID: ${opp.id} - ${opp.title} (${opp.createDate})`);
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
      
      console.log(`💾 4. Inserindo EXATAMENTE ${todayOpportunities.length} oportunidades no Supabase...`);
      console.log(`🔒 LISTA FINAL CONFIRMADA:`, todayOpportunities.map(opp => opp.id));
      
      let inserted = 0;
      let skipped = 0;
      let errors = 0;
      
      // LOOP SEGURO - processar APENAS as oportunidades filtradas
      for (let i = 0; i < todayOpportunities.length; i++) {
        const opp = todayOpportunities[i];
        
        console.log(`\n🔄 [${i+1}/${todayOpportunities.length}] Processando ID: ${opp.id}`);
        
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
            console.log(`   ⚪ JÁ EXISTE: ${opp.id} - ${opp.title}`);
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
          
          console.log(`   💾 Inserindo: ${opp.id} - ${opp.title}`);
          
          // Inserir
          const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/oportunidade_sprint`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'apikey': SUPABASE_KEY,
              'Accept-Profile': 'api',
            },
            body: JSON.stringify(mappedData)
          });
          
          if (insertResponse.ok) {
            inserted++;
            console.log(`   ✅ INSERIDO: ${opp.id} - ${opp.title}`);
          } else {
            errors++;
            console.log(`   ❌ ERRO: ${opp.id} - Status: ${insertResponse.status}`);
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          errors++;
          console.error(`   ❌ ERRO: ${opp.id} - ${error.message}`);
        }
      }
      
      console.log(`\n🔒 CONTROLE FINAL:`);
      console.log(`   📋 Array original: ${todayOpportunities.length} itens`);
      console.log(`   ✅ Inseridas: ${inserted}`);
      console.log(`   ⚪ Já existiam: ${skipped}`);  
      console.log(`   ❌ Erros: ${errors}`);
      console.log(`   🧮 Total processado: ${inserted + skipped + errors}`)
      
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
      console.error('❌ Erro:', error);
      alert(`❌ Erro: ${error.message}`);
    } finally {
      setIsSyncingToday(false);
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
      
      console.log('✅ Sincronização diária iniciada:', result);
      
    } catch (error) {
      console.error('❌ Erro ao iniciar sincronização diária:', error);
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
      console.log('🛑 Sincronização diária parada:', result);
      
    } catch (error) {
      console.error('❌ Erro ao parar sincronização diária:', error);
      alert(`❌ Erro ao parar: ${error.message}`);
    }
  };

  const handleTestDailySync = async () => {
    if (isTestingDailySync) return;
    
    const confirmTest = confirm(
      '🧪 TESTAR SINCRONIZAÇÃO DIÁRIA\n\n' +
      '🔍 Modo de teste (DRY RUN):\n' +
      '• Simula sincronização do dia anterior\n' +
      '• NÃO insere dados reais no banco\n' +
      '• Mostra quantas oportunidades seriam sincronizadas\n' +
      '• Útil para verificar se está funcionando\n\n' +
      'Deseja executar o teste?'
    );
    
    if (!confirmTest) return;
    
    setIsTestingDailySync(true);
    
    try {
      console.log('🧪 Iniciando teste de sincronização diária...');
      
      const result = await dailySyncService.testDailySync();
      
      if (result.success) {
        alert(
          `🧪 TESTE CONCLUÍDO!\n\n` +
          `📅 Data testada: ${result.targetDate}\n` +
          `🔍 Total encontradas: ${result.totalFound}\n` +
          `✅ Seriam inseridas: ${result.totalInserted}\n` +
          `⚪ Já existiam: ${result.totalSkipped}\n` +
          `❌ Erros: ${result.totalErrors}\n` +
          `⏱️ Duração: ${result.duration}s\n\n` +
          'Verifique o console para detalhes completos.'
        );
      } else {
        alert(`❌ Teste falhou: ${result.error}`);
      }
      
      console.log('🧪 Resultado do teste:', result);
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      alert(`❌ Erro no teste: ${error.message}`);
    } finally {
      setIsTestingDailySync(false);
    }
  };

  // 🎯 BUSCAR ETAPA 83 (NEGOCIAÇÃO) COM STATUS="OPEN" E PAGINAÇÃO COMPLETA
  const handleTestAllOpenOpportunities = async () => {
    if (isTestingAllOpen) return;
    
    const confirmTest = confirm(
      '🎯 SINCRONIZAÇÃO COMPLETA — TODAS ETAPAS ABERTAS\n\n' +
      '🔍 O que será executado:\n' +
      '• Buscar funil 6, TODAS as 7 etapas\n' +
      '• Filtrar apenas status="open"\n' +
      '• Paginação completa (todas as páginas)\n' +
      '• INSERIR registros novos no Supabase\n' +
      '• ATUALIZAR registros existentes\n' +
      '• Log detalhado por etapa e operação\n' +
      '• Resumo final com estatísticas completas\n\n' +
      '⚠️ ATENÇÃO: Irá INSERIR/ATUALIZAR dados no banco!\n\n' +
      'Deseja continuar com a sincronização completa?'
    );
    
    if (!confirmTest) return;
    
    setIsTestingAllOpen(true);
    
    const startTime = performance.now();
    
    try {
      console.log('🎯 INICIANDO SINCRONIZAÇÃO COMPLETA — TODAS ETAPAS ABERTAS');
      console.log('='.repeat(80));
      console.log(`🕒 Início: ${new Date().toLocaleTimeString('pt-BR')}`);
      
      // Configurações da API
      const SPRINTHUB_CONFIG = {
        baseUrl: 'sprinthub-api-master.sprinthub.app',
        apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c',
        instance: 'oficialmed'
      };
      
      const SUPABASE_CONFIG = {
        url: import.meta.env.VITE_SUPABASE_URL,
        serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      };
      
      const TARGET_FUNNEL = 6;
      const TARGET_STATUS = 'open';
      const PAGE_LIMIT = 100; // Limite máximo da API
      
      // 📋 TODAS AS ETAPAS DO FUNIL 6 (baseado no dailySyncService.js)
      const FUNIL_6_STAGES = [
        { id: 130, name: "[0] ENTRADA" },
        { id: 231, name: "[1] ACOLHIMENTO/TRIAGEM" },
        { id: 82, name: "[2] QUALIFICADO" },
        { id: 207, name: "[3] ORÇAMENTO REALIZADO" },
        { id: 83, name: "[4] NEGOCIAÇÃO" },
        { id: 85, name: "[5] FOLLOW UP" },
        { id: 232, name: "[6] CADASTRO" }
      ];
      
      console.log('🎯 CONFIGURAÇÃO DA SINCRONIZAÇÃO:');
      console.log(`   📊 Funil: ${TARGET_FUNNEL} (COMERCIAL APUCARANA)`);
      console.log(`   📋 Etapas: ${FUNIL_6_STAGES.length} etapas (TODAS)`);
      console.log(`   🔓 Status: "${TARGET_STATUS}"`);
      console.log(`   📄 Limit por página: ${PAGE_LIMIT}`);
      console.log('='.repeat(80));
      
      // 💾 FUNÇÃO PARA MAPEAR CAMPOS (baseada no sprintHubSyncService.js)
      const mapOpportunityFields = (opportunity) => {
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
          console.error(`❌ Erro ao verificar ID ${opportunityId}:`, error);
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
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
          });

          return { success: response.ok, status: response.status };
          
        } catch (error) {
          console.error('❌ Erro ao inserir:', error);
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
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
          });

          return { success: response.ok, status: response.status };
          
        } catch (error) {
          console.error('❌ Erro ao atualizar:', error);
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
      for (const stage of FUNIL_6_STAGES) {
        console.log(`\n📋 PROCESSANDO ETAPA: ${stage.name} (ID: ${stage.id})`);
        console.log('-'.repeat(60));
        
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
          console.log(`\n📄 ${stage.name} - Página ${currentPage + 1}:`);
          console.log(`🔍 Buscando etapa ${stage.id}, página ${currentPage}, limit ${PAGE_LIMIT}...`);
        
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
              console.error(`❌ Erro HTTP ${response.status} na página ${currentPage + 1}:`, errorText);
              break;
            }
            
            const pageOpportunities = await response.json();
            const opportunitiesArray = Array.isArray(pageOpportunities) ? pageOpportunities : [];
            
            console.log(`📊 Página ${currentPage + 1}: ${opportunitiesArray.length} registros retornados (${pageTime}ms)`);
            
            // Verificar se há dados na página
            if (opportunitiesArray.length === 0) {
              console.log('🏁 Página vazia - fim da paginação desta etapa');
              hasMorePages = false;
            } else {
              // Filtrar apenas status="open" nesta página
              const openOppsThisPage = opportunitiesArray.filter(opp => opp.status === TARGET_STATUS);
              
              console.log(`   🔓 Status "open" nesta página: ${openOppsThisPage.length}/${opportunitiesArray.length}`);
              
              // 💾 PROCESSAR E INSERIR/ATUALIZAR CADA OPORTUNIDADE
              if (openOppsThisPage.length > 0) {
                console.log(`   💾 Processando ${openOppsThisPage.length} oportunidades...`);
                
                for (const opp of openOppsThisPage) {
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
                        console.log(`     ✅ INSERIDO: ${opp.id} - ${opp.title}`);
                      } else {
                        totalErrors++;
                        stageErrors++;
                        console.log(`     ❌ Erro inserção: ${opp.id} - Status: ${result.status}`);
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
                          console.log(`     🔄 ATUALIZADO: ${opp.id} - ${opp.title}`);
                        } else {
                          totalErrors++;
                          stageErrors++;
                          console.log(`     ❌ Erro atualização: ${opp.id} - Status: ${result.status}`);
                        }
                      } else {
                        // Dados já estão atualizados
                        totalSkipped++;
                        stageSkipped++;
                        console.log(`     ⚪ Já atualizado: ${opp.id} - ${opp.title}`);
                      }
                    }
                    
                    // Rate limiting entre operações
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                  } catch (error) {
                    totalErrors++;
                    stageErrors++;
                    console.error(`     ❌ Erro processando ${opp.id}:`, error);
                  }
                }
                
                // Mostrar resumo da página
                console.log(`   📊 Página processada: ${stageInserted} inseridas | ${stageUpdated} atualizadas | ${stageSkipped} já atualizadas | ${stageErrors} erros`);
              }
              
              // Adicionar ao array geral
              stageOpportunities.push(...openOppsThisPage);
              
              // Se retornou menos que o limite, é a última página
              if (opportunitiesArray.length < PAGE_LIMIT) {
                console.log('🏁 Última página desta etapa detectada (< limite)');
                hasMorePages = false;
              } else {
                currentPage++;
              }
            }
            
            // Rate limiting entre páginas
            await new Promise(resolve => setTimeout(resolve, 300));
            
          } catch (error) {
            console.error(`❌ Erro na página ${currentPage + 1} da etapa ${stage.name}:`, error);
            hasMorePages = false;
          }
        }
        
        // Resumo da etapa
        console.log(`\n📊 RESUMO ETAPA ${stage.name}:`);
        console.log(`   📊 Total encontradas: ${stageOpportunities.length}`);
        console.log(`   ✅ Inseridas: ${stageInserted}`);
        console.log(`   🔄 Atualizadas: ${stageUpdated}`);
        console.log(`   ⚪ Já atualizadas: ${stageSkipped}`);
        console.log(`   ❌ Erros: ${stageErrors}`);
        
        // Adicionar ao array geral para estatísticas finais
        allOpportunities.push(...stageOpportunities);
        
        // Rate limiting entre etapas
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const endTime = performance.now();
      const totalTime = (endTime - startTime) / 1000; // em segundos
      
      // 📊 RELATÓRIO FINAL
      console.log('\n' + '='.repeat(80));
      console.log('📊 RELATÓRIO FINAL — SINCRONIZAÇÃO COMPLETA TODAS ETAPAS');
      console.log('='.repeat(80));
      console.log(`🕒 Tempo de execução: ${totalTime.toFixed(2)}s`);
      console.log(`📋 Etapas processadas: ${FUNIL_6_STAGES.length}`);
      console.log(`🔄 Total de chamadas à API: ${totalApiCalls}`);
      console.log(`📊 Total registros encontrados: ${allOpportunities.length}`);
      console.log(`💾 ESTATÍSTICAS DE SINCRONIZAÇÃO:`);
      console.log(`   ✅ Inseridos: ${totalInserted}`);
      console.log(`   🔄 Atualizados: ${totalUpdated}`);
      console.log(`   ⚪ Já atualizados: ${totalSkipped}`);
      console.log(`   ❌ Erros: ${totalErrors}`);
      
      if (allOpportunities.length > 0) {
        // IDs organizados
        const allIds = allOpportunities.map(opp => opp.id).sort((a, b) => a - b);
        const firstIds = allIds.slice(0, 5);
        const lastIds = allIds.slice(-5);
        
        console.log(`🆔 Primeiros IDs: ${firstIds.join(', ')}`);
        if (allOpportunities.length > 5) {
          console.log(`🆔 Últimos IDs: ${lastIds.join(', ')}`);
        }
        
        // Tabela resumo
        console.log('\n📋 TABELA RESUMO:');
        console.log('┌─────────────────────────────────┬──────────┐');
        console.log('│ Métrica                         │ Valor    │');
        console.log('├─────────────────────────────────┼──────────┤');
        console.log(`│ Funil                           │ ${TARGET_FUNNEL}        │`);
        console.log(`│ Etapas processadas              │ ${FUNIL_6_STAGES.length}        │`);
        console.log(`│ Status filtrado                 │ ${TARGET_STATUS}     │`);
        console.log(`│ Chamadas API                    │ ${totalApiCalls.toString().padEnd(8)} │`);
        console.log(`│ Registros encontrados           │ ${allOpportunities.length.toString().padEnd(8)} │`);
        console.log('├─────────────────────────────────┼──────────┤');
        console.log(`│ ✅ Inseridos no Supabase        │ ${totalInserted.toString().padEnd(8)} │`);
        console.log(`│ 🔄 Atualizados no Supabase      │ ${totalUpdated.toString().padEnd(8)} │`);
        console.log(`│ ⚪ Já atualizados               │ ${totalSkipped.toString().padEnd(8)} │`);
        console.log(`│ ❌ Erros                        │ ${totalErrors.toString().padEnd(8)} │`);
        console.log('├─────────────────────────────────┼──────────┤');
        console.log(`│ Tempo total (s)                 │ ${totalTime.toFixed(2).padEnd(8)} │`);
        console.log(`│ Tempo médio por etapa (s)       │ ${FUNIL_6_STAGES.length > 0 ? (totalTime / FUNIL_6_STAGES.length).toFixed(2).padEnd(8) : '0'.padEnd(8)} │`);
        console.log('└─────────────────────────────────┴──────────┘');
        
        // Amostra de dados
        console.log('\n🔍 AMOSTRA DE DADOS (primeiras 3 oportunidades):');
        allOpportunities.slice(0, 3).forEach((opp, index) => {
          console.log(`\n${index + 1}. ID: ${opp.id}`);
          console.log(`   📋 Título: ${opp.title}`);
          console.log(`   💰 Valor: R$ ${parseFloat(opp.value || 0).toFixed(2)}`);
          console.log(`   📅 Criação: ${opp.createDate ? new Date(opp.createDate).toLocaleDateString('pt-BR') : 'N/A'}`);
          console.log(`   👤 Responsável: ${opp.user || 'N/A'}`);
          console.log(`   🔗 Lead ID: ${opp.lead_id || 'N/A'}`);
        });
        
      } else {
        console.log('❌ Nenhuma oportunidade encontrada com os critérios especificados');
      }
      
      console.log('\n='.repeat(80));
      console.log('✅ SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log(`🕒 Finalizada em: ${new Date().toLocaleTimeString('pt-BR')}`);
      console.log('='.repeat(80));
      
      // 📅 ATUALIZAR ÚLTIMA SINCRONIZAÇÃO
      setLastSyncTime(new Date());
      
      // Alert final
      alert(
        `🎯 SINCRONIZAÇÃO COMPLETA — TODAS ETAPAS\n\n` +
        `✅ Sincronização concluída com sucesso!\n\n` +
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
      console.error('❌ ERRO NO TESTE:', error);
      console.error('Stack trace:', error.stack);
      alert(`❌ Erro no teste: ${error.message}\n\nVerifique o console para mais detalhes.`);
    } finally {
      setIsTestingAllOpen(false);
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
      console.log('📅 INICIANDO ATUALIZAÇÃO SEMANAL — FUNIS 6 E 14 — ÚLTIMOS 7 DIAS');
      console.log('='.repeat(80));
      console.log(`🕒 Início: ${new Date().toLocaleTimeString('pt-BR')}`);
      console.log(`📅 Período: ${sevenDaysAgo.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`);
      
      // Configurações da API
      const SPRINTHUB_CONFIG = {
        baseUrl: 'sprinthub-api-master.sprinthub.app',
        apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c',
        instance: 'oficialmed'
      };
      
      const SUPABASE_CONFIG = {
        url: import.meta.env.VITE_SUPABASE_URL,
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
      
      console.log('🎯 CONFIGURAÇÃO DA ATUALIZAÇÃO SEMANAL:');
      console.log(`   📊 Funis: ${FUNNELS_CONFIG.map(f => f.id).join(', ')} (APUCARANA)`);
      console.log(`   📋 Etapas: ${FUNNELS_CONFIG.reduce((acc, f) => acc + f.stages.length, 0)} etapas (TODAS)`);
      console.log(`   📅 Filtro: createDate dos últimos 7 dias (TODOS os status)`);
      console.log(`   📄 Limit por página: ${PAGE_LIMIT}`);
      console.log('='.repeat(80));
      
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
          console.error(`❌ Erro ao verificar ID ${opportunityId}:`, error);
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
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
          });

          return { success: response.ok, status: response.status };
          
        } catch (error) {
          console.error('❌ Erro ao inserir:', error);
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
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
          });

          return { success: response.ok, status: response.status };
          
        } catch (error) {
          console.error('❌ Erro ao atualizar:', error);
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
      for (const stage of FUNIL_6_STAGES) {
        console.log(`\n📋 PROCESSANDO ETAPA: ${stage.name} (ID: ${stage.id})`);
        console.log('-'.repeat(60));
        
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
          console.log(`\n📄 ${stage.name} - Página ${currentPage + 1}:`);
          console.log(`🔍 Buscando etapa ${stage.id}, página ${currentPage}, limit ${PAGE_LIMIT}...`);
        
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
              console.error(`❌ Erro HTTP ${response.status} na página ${currentPage + 1}:`, errorText);
              break;
            }
            
            const pageOpportunities = await response.json();
            const opportunitiesArray = Array.isArray(pageOpportunities) ? pageOpportunities : [];
            
            console.log(`📊 Página ${currentPage + 1}: ${opportunitiesArray.length} registros retornados (${pageTime}ms)`);
            
            // Verificar se há dados na página
            if (opportunitiesArray.length === 0) {
              console.log('🏁 Página vazia - fim da paginação desta etapa');
              hasMorePages = false;
            } else {
              // Filtrar por data de criação dos últimos 7 dias (TODOS os status)
              const last7DaysOpps = opportunitiesArray.filter(opp => isInLast7Days(opp.createDate));
              
              console.log(`   📅 Criadas nos últimos 7 dias: ${last7DaysOpps.length}/${opportunitiesArray.length}`);
              
              // 💾 PROCESSAR E INSERIR/ATUALIZAR CADA OPORTUNIDADE
              if (last7DaysOpps.length > 0) {
                console.log(`   💾 Processando ${last7DaysOpps.length} oportunidades...`);
                
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
                        console.log(`     ✅ INSERIDO: ${opp.id} - ${opp.title} (${opp.status})`);
                      } else {
                        totalErrors++;
                        stageErrors++;
                        console.log(`     ❌ Erro inserção: ${opp.id} - Status: ${result.status}`);
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
                          console.log(`     🔄 ATUALIZADO: ${opp.id} - ${opp.title} (${opp.status})`);
                        } else {
                          totalErrors++;
                          stageErrors++;
                          console.log(`     ❌ Erro atualização: ${opp.id} - Status: ${result.status}`);
                        }
                      } else {
                        // Dados já estão atualizados
                        totalSkipped++;
                        stageSkipped++;
                        console.log(`     ⚪ Já atualizado: ${opp.id} - ${opp.title} (${opp.status})`);
                      }
                    }
                    
                    // Rate limiting entre operações
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                  } catch (error) {
                    totalErrors++;
                    stageErrors++;
                    console.error(`     ❌ Erro processando ${opp.id}:`, error);
                  }
                }
                
                // Mostrar resumo da página
                console.log(`   📊 Página processada: ${stageInserted} inseridas | ${stageUpdated} atualizadas | ${stageSkipped} já atualizadas | ${stageErrors} erros`);
              }
              
              // Adicionar ao array geral
              stageOpportunities.push(...last7DaysOpps);
              
              // Se retornou menos que o limite, é a última página
              if (opportunitiesArray.length < PAGE_LIMIT) {
                console.log('🏁 Última página desta etapa detectada (< limite)');
                hasMorePages = false;
              } else {
                currentPage++;
              }
            }
            
            // Rate limiting entre páginas
            await new Promise(resolve => setTimeout(resolve, 300));
            
          } catch (error) {
            console.error(`❌ Erro na página ${currentPage + 1} da etapa ${stage.name}:`, error);
            hasMorePages = false;
          }
        }
        
        // Resumo da etapa
        console.log(`\n📊 RESUMO ETAPA ${stage.name}:`);
        console.log(`   📊 Total encontradas: ${stageOpportunities.length}`);
        console.log(`   ✅ Inseridas: ${stageInserted}`);
        console.log(`   🔄 Atualizadas: ${stageUpdated}`);
        console.log(`   ⚪ Já atualizadas: ${stageSkipped}`);
        console.log(`   ❌ Erros: ${stageErrors}`);
        
        // Adicionar ao array geral para estatísticas finais
        allOpportunities.push(...stageOpportunities);
        
        // Rate limiting entre etapas
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const endTime = performance.now();
      const totalTime = (endTime - startTime) / 1000; // em segundos
      
      // 📊 RELATÓRIO FINAL
      console.log('\n' + '='.repeat(80));
      console.log('📊 RELATÓRIO FINAL — ATUALIZAÇÃO SEMANAL');
      console.log('='.repeat(80));
      console.log(`🕒 Tempo de execução: ${totalTime.toFixed(2)}s`);
      console.log(`📅 Período: ${sevenDaysAgo.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`);
      console.log(`📋 Etapas processadas: ${FUNIL_6_STAGES.length}`);
      console.log(`🔄 Total de chamadas à API: ${totalApiCalls}`);
      console.log(`📊 Total registros encontrados: ${allOpportunities.length}`);
      console.log(`💾 ESTATÍSTICAS DE SINCRONIZAÇÃO:`);
      console.log(`   ✅ Inseridos: ${totalInserted}`);
      console.log(`   🔄 Atualizados: ${totalUpdated}`);
      console.log(`   ⚪ Já atualizados: ${totalSkipped}`);
      console.log(`   ❌ Erros: ${totalErrors}`);
      
      if (allOpportunities.length > 0) {
        // IDs organizados
        const allIds = allOpportunities.map(opp => opp.id).sort((a, b) => a - b);
        const firstIds = allIds.slice(0, 5);
        const lastIds = allIds.slice(-5);
        
        console.log(`🆔 Primeiros IDs: ${firstIds.join(', ')}`);
        if (allOpportunities.length > 5) {
          console.log(`🆔 Últimos IDs: ${lastIds.join(', ')}`);
        }
        
        // Tabela resumo
        console.log('\n📋 TABELA RESUMO:');
        console.log('┌─────────────────────────────────┬──────────┐');
        console.log('│ Métrica                         │ Valor    │');
        console.log('├─────────────────────────────────┼──────────┤');
        console.log(`│ Funil                           │ ${TARGET_FUNNEL}        │`);
        console.log(`│ Etapas processadas              │ ${FUNIL_6_STAGES.length}        │`);
        console.log(`│ Período (dias)                  │ 7        │`);
        console.log(`│ Chamadas API                    │ ${totalApiCalls.toString().padEnd(8)} │`);
        console.log(`│ Registros encontrados           │ ${allOpportunities.length.toString().padEnd(8)} │`);
        console.log('├─────────────────────────────────┼──────────┤');
        console.log(`│ ✅ Inseridos no Supabase        │ ${totalInserted.toString().padEnd(8)} │`);
        console.log(`│ 🔄 Atualizados no Supabase      │ ${totalUpdated.toString().padEnd(8)} │`);
        console.log(`│ ⚪ Já atualizados               │ ${totalSkipped.toString().padEnd(8)} │`);
        console.log(`│ ❌ Erros                        │ ${totalErrors.toString().padEnd(8)} │`);
        console.log('├─────────────────────────────────┼──────────┤');
        console.log(`│ Tempo total (s)                 │ ${totalTime.toFixed(2).padEnd(8)} │`);
        console.log(`│ Tempo médio por etapa (s)       │ ${FUNIL_6_STAGES.length > 0 ? (totalTime / FUNIL_6_STAGES.length).toFixed(2).padEnd(8) : '0'.padEnd(8)} │`);
        console.log('└─────────────────────────────────┴──────────┘');
        
        // Amostra de dados
        console.log('\n🔍 AMOSTRA DE DADOS (primeiras 3 oportunidades):');
        allOpportunities.slice(0, 3).forEach((opp, index) => {
          console.log(`\n${index + 1}. ID: ${opp.id}`);
          console.log(`   📋 Título: ${opp.title}`);
          console.log(`   💰 Valor: R$ ${parseFloat(opp.value || 0).toFixed(2)}`);
          console.log(`   📅 Criação: ${opp.createDate ? new Date(opp.createDate).toLocaleDateString('pt-BR') : 'N/A'}`);
          console.log(`   👤 Responsável: ${opp.user || 'N/A'}`);
          console.log(`   🔗 Lead ID: ${opp.lead_id || 'N/A'}`);
          console.log(`   📊 Status: ${opp.status || 'N/A'}`);
        });
        
      } else {
        console.log('❌ Nenhuma oportunidade encontrada nos últimos 7 dias');
      }
      
      console.log('\n='.repeat(80));
      console.log('✅ ATUALIZAÇÃO SEMANAL CONCLUÍDA COM SUCESSO!');
      console.log(`🕒 Finalizada em: ${new Date().toLocaleTimeString('pt-BR')}`);
      console.log('='.repeat(80));
      
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
      console.error('❌ ERRO NA ATUALIZAÇÃO SEMANAL:', error);
      console.error('Stack trace:', error.stack);
      alert(`❌ Erro na atualização: ${error.message}\n\nVerifique o console para mais detalhes.`);
    } finally {
      setIsSyncingWeekly(false);
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
      console.log('🕐 INICIANDO SINCRONIZAÇÃO HORÁRIA — HOJE');
      console.log('='.repeat(80));
      console.log(`🕒 Início: ${new Date().toLocaleTimeString('pt-BR')}`);
      console.log(`📅 Período: ${today.toLocaleDateString('pt-BR')} (hoje)`);
      
      // Configurações da API
      const SPRINTHUB_CONFIG = {
        baseUrl: 'sprinthub-api-master.sprinthub.app',
        apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c',
        instance: 'oficialmed'
      };
      
      const SUPABASE_CONFIG = {
        url: import.meta.env.VITE_SUPABASE_URL,
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
      
      console.log('🎯 CONFIGURAÇÃO DA SINCRONIZAÇÃO HORÁRIA:');
      console.log(`   📊 Funis: 6 (APUCARANA) e 14 (RECOMPRA)`);
      console.log(`   📋 Total etapas: ${FUNIS_CONFIG[6].stages.length + FUNIS_CONFIG[14].stages.length}`);
      console.log(`   📅 Filtro: createDate de hoje (TODOS os status)`);
      console.log(`   📄 Limit por página: ${PAGE_LIMIT}`);
      console.log('='.repeat(80));
      
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
          console.error(`❌ Erro ao verificar ID ${opportunityId}:`, error);
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
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
          });

          return { success: response.ok, status: response.status };
          
        } catch (error) {
          console.error('❌ Erro ao inserir:', error);
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
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
          });

          return { success: response.ok, status: response.status };
          
        } catch (error) {
          console.error('❌ Erro ao atualizar:', error);
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
      for (const [funnelId, funnelConfig] of Object.entries(FUNIS_CONFIG)) {
        console.log(`\n🎯 PROCESSANDO FUNIL ${funnelId}: ${funnelConfig.name}`);
        console.log('='.repeat(60));
        
        let funnelInserted = 0;
        let funnelUpdated = 0;
        let funnelSkipped = 0;
        let funnelErrors = 0;
        
        // 🔄 PROCESSAR CADA ETAPA DO FUNIL
        for (const stage of funnelConfig.stages) {
          console.log(`\n📋 PROCESSANDO ETAPA: ${stage.name} (ID: ${stage.id})`);
          console.log('-'.repeat(60));
          
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
            console.log(`\n📄 ${stage.name} - Página ${currentPage + 1}:`);
            console.log(`🔍 Buscando funil ${funnelId}, etapa ${stage.id}, página ${currentPage}, limit ${PAGE_LIMIT}...`);
          
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
                console.error(`❌ Erro HTTP ${response.status} na página ${currentPage + 1}:`, errorText);
                break;
              }
              
              const pageOpportunities = await response.json();
              const opportunitiesArray = Array.isArray(pageOpportunities) ? pageOpportunities : [];
              
              console.log(`📊 Página ${currentPage + 1}: ${opportunitiesArray.length} registros retornados (${pageTime}ms)`);
              
              // Verificar se há dados na página
              if (opportunitiesArray.length === 0) {
                console.log('🏁 Página vazia - fim da paginação desta etapa');
                hasMorePages = false;
              } else {
                // Filtrar por data de criação de hoje (TODOS os status)
                const todayOpps = opportunitiesArray.filter(opp => isToday(opp.createDate));
                
                console.log(`   📅 Criadas hoje: ${todayOpps.length}/${opportunitiesArray.length}`);
                
                // 💾 PROCESSAR E INSERIR/ATUALIZAR CADA OPORTUNIDADE
                if (todayOpps.length > 0) {
                  console.log(`   💾 Processando ${todayOpps.length} oportunidades...`);
                  
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
                          console.log(`     ✅ INSERIDO: ${opp.id} - ${opp.title} (${opp.status})`);
                        } else {
                          totalErrors++;
                          funnelErrors++;
                          stageErrors++;
                          console.log(`     ❌ Erro inserção: ${opp.id} - Status: ${result.status}`);
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
                            console.log(`     🔄 ATUALIZADO: ${opp.id} - ${opp.title} (${opp.status})`);
                          } else {
                            totalErrors++;
                            funnelErrors++;
                            stageErrors++;
                            console.log(`     ❌ Erro atualização: ${opp.id} - Status: ${result.status}`);
                          }
                        } else {
                          // Dados já estão atualizados
                          totalSkipped++;
                          funnelSkipped++;
                          stageSkipped++;
                          console.log(`     ⚪ Já atualizado: ${opp.id} - ${opp.title} (${opp.status})`);
                        }
                      }
                      
                      // Rate limiting entre operações
                      await new Promise(resolve => setTimeout(resolve, 50));
                      
                    } catch (error) {
                      totalErrors++;
                      funnelErrors++;
                      stageErrors++;
                      console.error(`     ❌ Erro processando ${opp.id}:`, error);
                    }
                  }
                  
                  // Mostrar resumo da página
                  console.log(`   📊 Página processada: ${stageInserted} inseridas | ${stageUpdated} atualizadas | ${stageSkipped} já atualizadas | ${stageErrors} erros`);
                }
                
                // Adicionar ao array geral
                stageOpportunities.push(...todayOpps);
                
                // Se retornou menos que o limite, é a última página
                if (opportunitiesArray.length < PAGE_LIMIT) {
                  console.log('🏁 Última página desta etapa detectada (< limite)');
                  hasMorePages = false;
                } else {
                  currentPage++;
                }
              }
              
              // Rate limiting entre páginas
              await new Promise(resolve => setTimeout(resolve, 200));
              
            } catch (error) {
              console.error(`❌ Erro na página ${currentPage + 1} da etapa ${stage.name}:`, error);
              hasMorePages = false;
            }
          }
          
          // Resumo da etapa
          console.log(`\n📊 RESUMO ETAPA ${stage.name}:`);
          console.log(`   📊 Total encontradas: ${stageOpportunities.length}`);
          console.log(`   ✅ Inseridas: ${stageInserted}`);
          console.log(`   🔄 Atualizadas: ${stageUpdated}`);
          console.log(`   ⚪ Já atualizadas: ${stageSkipped}`);
          console.log(`   ❌ Erros: ${stageErrors}`);
          
          // Adicionar ao array geral para estatísticas finais
          allOpportunities.push(...stageOpportunities);
          
          // Rate limiting entre etapas
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Resumo do funil
        console.log(`\n📊 RESUMO FUNIL ${funnelId} (${funnelConfig.name}):`);
        console.log(`   ✅ Inseridas: ${funnelInserted}`);
        console.log(`   🔄 Atualizadas: ${funnelUpdated}`);
        console.log(`   ⚪ Já atualizadas: ${funnelSkipped}`);
        console.log(`   ❌ Erros: ${funnelErrors}`);
        
        // Rate limiting entre funis
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const endTime = performance.now();
      const totalTime = (endTime - startTime) / 1000; // em segundos
      
      // 📊 RELATÓRIO FINAL
      console.log('\n' + '='.repeat(80));
      console.log('📊 RELATÓRIO FINAL — SINCRONIZAÇÃO HORÁRIA');
      console.log('='.repeat(80));
      console.log(`🕒 Tempo de execução: ${totalTime.toFixed(2)}s`);
      console.log(`📅 Período: ${today.toLocaleDateString('pt-BR')} (hoje)`);
      console.log(`🎯 Funis processados: 6 (APUCARANA) e 14 (RECOMPRA)`);
      console.log(`🔄 Total de chamadas à API: ${totalApiCalls}`);
      console.log(`📊 Total registros encontrados: ${allOpportunities.length}`);
      console.log(`💾 ESTATÍSTICAS DE SINCRONIZAÇÃO:`);
      console.log(`   ✅ Inseridos: ${totalInserted}`);
      console.log(`   🔄 Atualizados: ${totalUpdated}`);
      console.log(`   ⚪ Já atualizados: ${totalSkipped}`);
      console.log(`   ❌ Erros: ${totalErrors}`);
      
      if (allOpportunities.length > 0) {
        // IDs organizados
        const allIds = allOpportunities.map(opp => opp.id).sort((a, b) => a - b);
        const firstIds = allIds.slice(0, 5);
        const lastIds = allIds.slice(-5);
        
        console.log(`🆔 Primeiros IDs: ${firstIds.join(', ')}`);
        if (allOpportunities.length > 5) {
          console.log(`🆔 Últimos IDs: ${lastIds.join(', ')}`);
        }
        
        // Tabela resumo
        console.log('\n📋 TABELA RESUMO:');
        console.log('┌─────────────────────────────────┬──────────┐');
        console.log('│ Métrica                         │ Valor    │');
        console.log('├─────────────────────────────────┼──────────┤');
        console.log('│ Funis processados               │ 2        │');
        console.log(`│ Chamadas API                    │ ${totalApiCalls.toString().padEnd(8)} │`);
        console.log(`│ Registros encontrados           │ ${allOpportunities.length.toString().padEnd(8)} │`);
        console.log('├─────────────────────────────────┼──────────┤');
        console.log(`│ ✅ Inseridos no Supabase        │ ${totalInserted.toString().padEnd(8)} │`);
        console.log(`│ 🔄 Atualizados no Supabase      │ ${totalUpdated.toString().padEnd(8)} │`);
        console.log(`│ ⚪ Já atualizados               │ ${totalSkipped.toString().padEnd(8)} │`);
        console.log(`│ ❌ Erros                        │ ${totalErrors.toString().padEnd(8)} │`);
        console.log('├─────────────────────────────────┼──────────┤');
        console.log(`│ Tempo total (s)                 │ ${totalTime.toFixed(2).padEnd(8)} │`);
        console.log('└─────────────────────────────────┴──────────┘');
        
        // Amostra de dados
        console.log('\n🔍 AMOSTRA DE DADOS (primeiras 3 oportunidades):');
        allOpportunities.slice(0, 3).forEach((opp, index) => {
          console.log(`\n${index + 1}. ID: ${opp.id}`);
          console.log(`   📋 Título: ${opp.title}`);
          console.log(`   💰 Valor: R$ ${parseFloat(opp.value || 0).toFixed(2)}`);
          console.log(`   📅 Criação: ${opp.createDate ? new Date(opp.createDate).toLocaleDateString('pt-BR') : 'N/A'}`);
          console.log(`   👤 Responsável: ${opp.user || 'N/A'}`);
          console.log(`   🔗 Lead ID: ${opp.lead_id || 'N/A'}`);
          console.log(`   📊 Status: ${opp.status || 'N/A'}`);
        });
        
      } else {
        console.log('❌ Nenhuma oportunidade encontrada hoje');
      }
      
      console.log('\n='.repeat(80));
      console.log('✅ SINCRONIZAÇÃO HORÁRIA CONCLUÍDA COM SUCESSO!');
      console.log(`🕒 Finalizada em: ${new Date().toLocaleTimeString('pt-BR')}`);
      console.log('='.repeat(80));
      
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
      console.error('❌ ERRO NA SINCRONIZAÇÃO HORÁRIA:', error);
      console.error('Stack trace:', error.stack);
      alert(`❌ Erro na sincronização: ${error.message}\n\nVerifique o console para mais detalhes.`);
    } finally {
      setIsSyncingHourly(false);
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
      console.log('🛑 Sincronização horária automática PARADA');
    } else {
      // Iniciar sincronização automática (a cada hora)
      const interval = setInterval(() => {
        console.log('🕐 Executando sincronização horária automática...');
        handleHourlySync();
      }, 60 * 60 * 1000); // 60 minutos = 1 hora
      
      setHourlySyncInterval(interval);
      setIsHourlySyncRunning(true);
      console.log('🕐 Sincronização horária automática INICIADA (executa a cada hora)');
      
      // Executar imediatamente na primeira vez
      handleHourlySync();
      
      // 📅 ATUALIZAR ÚLTIMA SINCRONIZAÇÃO (será atualizada novamente pelo handleHourlySync)
      setLastSyncTime(new Date());
    }
  };

  // 🎯 FUNÇÃO PARA TESTAR FUNIL ESPECÍFICO
  const handleTestFunil = async (funilId) => {
    try {
      console.log(`🔍 Testando funil ${funilId}...`);
      const result = await testFunilSpecific(funilId);
      console.log('✅ Resultado do teste:', result);
    } catch (error) {
      console.error('❌ Erro no teste do funil:', error);
    }
  };

  // 🎯 FUNÇÃO PARA TESTAR FUNIL COM UNIDADE ESPECÍFICA
  const handleTestFunilUnidade = async (funilId) => {
    try {
      console.log(`🔍 Testando funil ${funilId} com unidade [1]...`);
      const result = await testFunilSpecificWithUnit(funilId, '[1]');
      console.log('✅ Resultado do teste com unidade:', result);
    } catch (error) {
      console.error('❌ Erro no teste do funil com unidade:', error);
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
      console.warn('⚠️ Erro ao verificar status do serviço diário:', error);
    }
  }, []);

  // Carregar status do serviço de sincronização ao montar
  useEffect(() => {
    const status = autoSyncService.getStatus();
    setLastSyncTime(status.lastSyncTime);
    
    // Escutar atualizações do serviço
    const handleSyncUpdate = (event) => {
      setLastSyncTime(event.detail.lastSyncTime);
    };
    
    window.addEventListener('syncStatusUpdated', handleSyncUpdate);
    
    return () => {
      window.removeEventListener('syncStatusUpdated', handleSyncUpdate);
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
        
        {/* Botões do Serviço Diário - apenas para admin */}
        {isAdmin && (
          <>
            <button 
              className={`tmb-sync-btn ${isTestingAllOpen ? 'syncing' : ''}`}
              onClick={handleTestAllOpenOpportunities}
              disabled={isTestingAllOpen || isSyncingWeekly}
              title="Sincronizar TODAS as etapas do funil 6 com status='open' - insere novos e atualiza existentes"
              style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}
            >
              {isTestingAllOpen ? (
                <>
                  <span className="tmb-sync-spinner"></span>
                  Sincronizando...
                </>
              ) : (
                <>
                  🎯 Etapas Abertas — Todas
                </>
              )}
            </button>
            
            <button 
              className={`tmb-sync-btn ${isSyncingWeekly ? 'syncing' : ''}`}
              onClick={handleSyncWeeklyOpportunities}
              disabled={isSyncingWeekly || isTestingAllOpen || isSyncingHourly}
              title="Atualização semanal - busca oportunidades criadas nos últimos 7 dias nos funis 6 (COMPRA) e 14 (RECOMPRA) - unidade Apucarana [1]"
              style={{ marginLeft: '8px', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
            >
              {isSyncingWeekly ? (
                <>
                  <span className="tmb-sync-spinner"></span>
                  Atualizando...
                </>
              ) : (
                <>
                  📅 Atualização Semanal
                </>
              )}
            </button>
            
            <button 
              className={`tmb-sync-btn ${isSyncingHourly ? 'syncing' : ''}`}
              onClick={handleHourlySync}
              disabled={isSyncingHourly || isTestingAllOpen || isSyncingWeekly}
              title="Sincronização horária - busca oportunidades criadas hoje nos funis 6 (APUCARANA) e 14 (RECOMPRA)"
              style={{ marginLeft: '8px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              {isSyncingHourly ? (
                <>
                  <span className="tmb-sync-spinner"></span>
                  Sincronizando...
                </>
              ) : (
                <>
                  🕐 Hoje - Apucarana
                </>
              )}
            </button>
            
            <button
              className={`tmb-sync-btn ${isHourlySyncRunning ? 'active' : ''}`}
              onClick={handleToggleHourlySync}
              disabled={isSyncingHourly || isTestingAllOpen || isSyncingWeekly}
              title={isHourlySyncRunning ? "Parar sincronização horária automática" : "Iniciar sincronização horária automática (executa a cada hora)"}
              style={{
                marginLeft: '8px',
                background: isHourlySyncRunning
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
              }}
            >
              {isHourlySyncRunning ? (
                <>
                  🛑 Parar Auto
                </>
              ) : (
                <>
                  🕐 Iniciar Auto
                </>
              )}
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
