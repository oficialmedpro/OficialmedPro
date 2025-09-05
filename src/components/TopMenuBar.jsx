import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { syncFollowUpStage, checkFollowUpSync } from '../service/sprintHubSyncService';
import autoSyncService from '../service/autoSyncService';
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
  const languageDropdownRef = useRef(null);
  
  // Verificar se é admin (temporário - baseado nas credenciais fixas)
  const isAdmin = true; // Por enquanto sempre admin, depois implementar lógica real

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
      
      const opportunities = await response.json();
      
      console.log(`📊 Total oportunidades encontradas: ${opportunities.length}`);
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

  // Função para sincronizar oportunidades faltantes de hoje
  const handleSyncToday = async () => {
    if (isSyncingToday) return;
    
    setIsSyncingToday(true);
    console.log('🔄 Iniciando sincronização de oportunidades faltantes de hoje...');
    
    try {
      const SPRINTHUB_URL = 'https://sprinthub-api-master.sprinthub.app';
      const API_TOKEN = '9ad36c85-5858-4960-9935-e73c3698dd0c';
      const INSTANCE = 'oficialmed';
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      
      let totalInserted = 0;
      let totalUpdated = 0;
      let totalProcessed = 0;
      let totalSkipped = 0;
      
      // Funis da unidade Apucarana
      const funis = [
        { id: 6, stages: [130, 231, 82, 207, 83, 85, 232] },
        { id: 14, stages: [227, 202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 147, 167, 148, 168, 149, 169, 150] }
      ];
      
      const today = new Date().toDateString();
      console.log('📅 Data de hoje para comparação:', today);
      
      for (const funil of funis) {
        console.log(`🎯 Processando Funil ${funil.id}...`);
        
        for (const stageId of funil.stages) {
          try {
            console.log(`  📊 Processando Etapa ${stageId}...`);
            
            // 🔄 BUSCAR TODAS AS PÁGINAS DA ETAPA
            let page = 0;
            let hasMoreData = true;
            let stageOppCount = 0;
            let stageTodayCount = 0;
            
            while (hasMoreData) {
              console.log(`    📄 Página ${page}...`);
              
              const postData = JSON.stringify({ page: page, limit: 50, columnId: stageId });
              const response = await fetch(`${SPRINTHUB_URL}/crm/opportunities/${funil.id}?apitoken=${API_TOKEN}&i=${INSTANCE}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: postData
              });
              
              if (!response.ok) {
                console.log(`    ❌ Erro HTTP ${response.status} na página ${page}`);
                break;
              }
              
              const opportunities = await response.json();
              if (!Array.isArray(opportunities) || opportunities.length === 0) {
                console.log(`    ⚪ Página ${page} vazia ou inválida`);
                break;
              }
              
              stageOppCount += opportunities.length;
              console.log(`    📊 Página ${page}: ${opportunities.length} oportunidades`);
              
              // Filtrar apenas oportunidades de hoje
              const todayOpps = opportunities.filter(opp => {
                if (!opp.createDate) return false;
                const oppDate = new Date(opp.createDate).toDateString();
                const todayString = new Date().toDateString();
                return oppDate === todayString;
              });
              
              stageTodayCount += todayOpps.length;
              console.log(`    📅 Página ${page}: ${todayOpps.length} de hoje`);
              
              // Se retornou menos que 50, é a última página
              if (opportunities.length < 50) {
                hasMoreData = false;
                console.log(`    ✅ Última página da etapa ${stageId} (retornou ${opportunities.length})`);
              }
            
              // Processar cada oportunidade de hoje desta página
              for (const opp of todayOpps) {
                totalProcessed++;
                
                try {
                  // Verificar se existe no Supabase (buscar mais dados para comparar)
                  const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/oportunidade_sprint?id=eq.${opp.id}&select=id,update_date`, {
                    headers: {
                      'Accept': 'application/json',
                      'Authorization': `Bearer ${SUPABASE_KEY}`,
                      'apikey': SUPABASE_KEY,
                      'Accept-Profile': 'api'
                    }
                  });
                  
                  if (!checkResponse.ok) continue;
                  const existing = await checkResponse.json();
                  
                  // Mapear dados da oportunidade
                  const fields = opp.fields || {};
                  const lead = opp.dataLead || {};
                  
                  const mappedOpp = {
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
                    lead_firstname: lead.firstname || null,
                    lead_email: lead.email || null,
                    lead_whatsapp: lead.whatsapp || null,
                    archived: opp.archived || 0,
                    synced_at: new Date().toISOString(),
                    funil_id: funil.id,
                    unidade_id: '[1]'
                  };
                  
                  if (!existing || existing.length === 0) {
                    // ➕ NÃO EXISTE - INSERIR
                    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/oportunidade_sprint`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'apikey': SUPABASE_KEY,
                        'Accept-Profile': 'api'
                      },
                      body: JSON.stringify(mappedOpp)
                    });
                    
                    if (insertResponse.ok) {
                      totalInserted++;
                      console.log(`    ➕ Inserida: ${opp.id} - ${opp.title}`);
                    } else {
                      console.error(`    ❌ Erro ao inserir ${opp.id}: ${insertResponse.status}`);
                    }
                    
                  } else {
                    // 🔄 EXISTE - VERIFICAR SE PRECISA ATUALIZAR
                    const existingRecord = existing[0];
                    const sprintHubDate = new Date(opp.updateDate);
                    const supabaseDate = new Date(existingRecord.update_date);
                    
                    if (sprintHubDate > supabaseDate) {
                      // SprintHub mais recente - atualizar
                      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/oportunidade_sprint?id=eq.${opp.id}`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${SUPABASE_KEY}`,
                          'apikey': SUPABASE_KEY,
                          'Accept-Profile': 'api'
                        },
                        body: JSON.stringify(mappedOpp)
                      });
                      
                      if (updateResponse.ok) {
                        totalUpdated++;
                        console.log(`    🔄 Atualizada: ${opp.id} - ${opp.title}`);
                      } else {
                        console.error(`    ❌ Erro ao atualizar ${opp.id}: ${updateResponse.status}`);
                      }
                    } else {
                      totalSkipped++;
                      console.log(`    ⚪ Já atualizada: ${opp.id}`);
                    }
                  }
                  
                  await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
                  
                } catch (error) {
                  console.error(`    ❌ Erro processando ${opp.id}:`, error);
                }
              }
              
              // Próxima página
              page++;
              await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting entre páginas
            }
            
            console.log(`  ✅ Etapa ${stageId} concluída: ${stageOppCount} total, ${stageTodayCount} de hoje`);
            await new Promise(resolve => setTimeout(resolve, 300)); // Rate limiting entre etapas
            
            await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting entre etapas
          } catch (error) {
            console.error(`❌ Erro na etapa ${stageId}:`, error);
          }
        }
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('📊 RELATÓRIO FINAL - SINCRONIZAÇÃO DE HOJE');
      console.log('='.repeat(60));
      console.log(`📈 Total processadas: ${totalProcessed}`);
      console.log(`➕ Total inseridas: ${totalInserted}`);
      console.log(`🔄 Total atualizadas: ${totalUpdated}`);
      console.log(`⚪ Total já atualizadas: ${totalSkipped}`);
      console.log('='.repeat(60));
      
      const message = `✅ Sincronização de HOJE concluída!\n\n` +
        `📊 Processadas: ${totalProcessed}\n` +
        `➕ Inseridas: ${totalInserted}\n` +
        `🔄 Atualizadas: ${totalUpdated}\n` +
        `⚪ Já atualizadas: ${totalSkipped}\n\n` +
        `🔍 Agora verifique no Supabase - deve ter exatamente 198 oportunidades de hoje!`;
      
      alert(message);
      
    } catch (error) {
      console.error('❌ Erro na sincronização de hoje:', error);
      alert('❌ Erro na sincronização. Verifique o console para detalhes.');
    } finally {
      setIsSyncingToday(false);
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
              disabled={isSyncing || isSyncingToday}
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
              disabled={isSyncing || isSyncingToday}
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
