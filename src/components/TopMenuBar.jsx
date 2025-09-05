import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { syncFollowUpStage, checkFollowUpSync } from '../service/sprintHubSyncService';
import autoSyncService from '../service/autoSyncService';
import { generateDuplicateReport, performFullCleanup } from '../service/duplicateCleanupService';
import { syncTodayOnly, syncAll, checkFullSync } from '../service/unifiedSyncService';
import todaySyncService from '../service/todaySyncService';
import detacorretaIncremental from '../service/detacorreta_incremental';
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
              'Content-Profile': 'api'
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
      
    } catch (error) {
      console.error('❌ Erro:', error);
      alert(`❌ Erro: ${error.message}`);
    } finally {
      setIsSyncingToday(false);
    }
  };

  // Função para limpar duplicatas
  const handleCleanDuplicates = async () => {
    if (isCleaningDuplicates) return;
    
    setIsCleaningDuplicates(true);
    console.log('🧹 Iniciando limpeza de duplicatas...');
    
    try {
      // Primeiro, gerar relatório
      const report = await generateDuplicateReport();
      
      if (report.duplicates === 0) {
        alert('✅ Nenhuma duplicata encontrada!');
        return;
      }
      
      const confirmClean = confirm(
        `🔍 Encontradas ${report.duplicates} grupos de duplicatas (${report.totalRecords} registros duplicados).\n\n` +
        `Deseja remover as duplicatas? (Mantém apenas o registro mais recente)`
      );
      
      if (!confirmClean) {
        console.log('❌ Limpeza cancelada pelo usuário');
        return;
      }
      
      // Executar limpeza
      const result = await performFullCleanup();
      
      if (result.success) {
        alert(`✅ Limpeza concluída!\n\n` +
          `🧹 Duplicatas removidas: ${result.removed}\n` +
          `📊 Grupos processados: ${result.processed}`);
      } else {
        alert(`❌ Erro na limpeza: ${result.error}`);
      }
      
    } catch (error) {
      console.error('❌ Erro na limpeza de duplicatas:', error);
      alert('❌ Erro na limpeza. Verifique o console para detalhes.');
    } finally {
      setIsCleaningDuplicates(false);
    }
  };

  // Função para sincronização completa
  const handleFullSync = async () => {
    if (isFullSyncing) return;
    
    const confirmSync = confirm(
      '⚠️ ATENÇÃO: Sincronização completa irá processar TODAS as oportunidades!\n\n' +
      'Isso pode demorar vários minutos e fazer muitas operações no banco.\n\n' +
      'Deseja continuar?'
    );
    
    if (!confirmSync) return;
    
    setIsFullSyncing(true);
    console.log('🔄 Iniciando sincronização COMPLETA...');
    
    try {
      const result = await syncAll({
        onProgress: (progress) => {
          console.log(`📊 Progresso: ${progress.stage} - ${progress.status}`);
        }
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      const message = `✅ Sincronização COMPLETA concluída!\n\n` +
        `📊 Processadas: ${result.totalProcessed}\n` +
        `➕ Inseridas: ${result.totalInserted}\n` +
        `🔄 Atualizadas: ${result.totalUpdated}\n` +
        `⚪ Já atualizadas: ${result.totalSkipped}\n` +
        `❌ Erros: ${result.totalErrors}\n` +
        `⏱️ Duração: ${result.duration}s`;
      
      alert(message);
                  
                } catch (error) {
      console.error('❌ Erro na sincronização completa:', error);
      alert(`❌ Erro na sincronização: ${error.message}`);
    } finally {
      setIsFullSyncing(false);
    }
  };

  // Função para verificar sincronização
  const handleCheckSync = async () => {
    if (isCheckingSync) return;
    
    setIsCheckingSync(true);
    console.log('🔍 Verificando sincronização...');
    
    try {
      const result = await checkFullSync();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      const message = `📊 RELATÓRIO DE SINCRONIZAÇÃO\n\n` +
        `📈 SprintHub: ${result.totalSprintHub.toLocaleString()} oportunidades\n` +
        `✅ Supabase: ${result.totalSupabase.toLocaleString()} oportunidades\n` +
        `❌ Faltando: ${result.totalMissing.toLocaleString()} oportunidades\n` +
        `📊 Taxa: ${result.percentualGeral}%\n` +
        `⏱️ Duração: ${result.duration}s`;
      
      alert(message);
      
    } catch (error) {
      console.error('❌ Erro na verificação:', error);
      alert(`❌ Erro na verificação: ${error.message}`);
    } finally {
      setIsCheckingSync(false);
    }
  };

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
        
        {/* Botões de sincronização - apenas para admin */}
        {isAdmin && (
          <>
            <button 
              className={`tmb-sync-btn ${isSyncing ? 'syncing' : ''}`}
              onClick={handleSync}
              disabled={isSyncing || isSyncingToday || isCleaningDuplicates || isFullSyncing || isCheckingSync}
              title="Sincronizar dados do SprintHub"
            >
              {isSyncing ? (
                <>
                  <span className="tmb-sync-spinner"></span>
                  Sincronizando...
                </>
              ) : (
                <>
                  🔄 Sincronizar
                </>
              )}
            </button>
            
            <button 
              className={`tmb-sync-btn ${isSyncingToday ? 'syncing' : ''}`}
              onClick={handleSyncToday}
              disabled={isSyncing || isSyncingToday || isCleaningDuplicates || isFullSyncing || isCheckingSync}
              title="Sincronizar oportunidades faltantes de hoje"
              style={{ marginLeft: '8px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
            >
              {isSyncingToday ? (
                <>
                  <span className="tmb-sync-spinner"></span>
                  Hoje...
                </>
              ) : (
                <>
                  📅 Hoje
                </>
              )}
            </button>
            
            <button 
              className={`tmb-sync-btn ${isCleaningDuplicates ? 'syncing' : ''}`}
              onClick={handleCleanDuplicates}
              disabled={isSyncing || isSyncingToday || isCleaningDuplicates || isFullSyncing || isCheckingSync}
              title="Limpar duplicatas no Supabase"
              style={{ marginLeft: '8px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
            >
              {isCleaningDuplicates ? (
                <>
                  <span className="tmb-sync-spinner"></span>
                  Limpando...
                </>
              ) : (
                <>
                  🧹 Limpar
                </>
              )}
            </button>
            
            <button 
              className={`tmb-sync-btn ${isFullSyncing ? 'syncing' : ''}`}
              onClick={handleFullSync}
              disabled={isSyncing || isSyncingToday || isCleaningDuplicates || isFullSyncing || isCheckingSync}
              title="Sincronização completa (TODAS as oportunidades)"
              style={{ marginLeft: '8px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}
            >
              {isFullSyncing ? (
                <>
                  <span className="tmb-sync-spinner"></span>
                  Completa...
                </>
              ) : (
                <>
                  🔄 Completa
                </>
              )}
            </button>
            
            <button 
              className={`tmb-sync-btn ${isCheckingSync ? 'syncing' : ''}`}
              onClick={handleCheckSync}
              disabled={isSyncing || isSyncingToday || isCleaningDuplicates || isFullSyncing || isCheckingSync}
              title="Verificar status da sincronização"
              style={{ marginLeft: '8px', background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}
            >
              {isCheckingSync ? (
                <>
                  <span className="tmb-sync-spinner"></span>
                  Verificando...
                </>
              ) : (
                <>
                  🔍 Verificar
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
