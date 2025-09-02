/**
 * 🔄 SERVIÇO DE SINCRONIZAÇÃO AUTOMÁTICA
 * 
 * Executa sincronização automática a cada 2 horas
 * Horário de funcionamento: 06:00 - 22:00 (GMT-3 São Paulo)
 * Fora desse horário o serviço fica inativo
 */

import { syncFollowUpStage, checkFollowUpSync } from './sprintHubSyncService.js';

class AutoSyncService {
    constructor() {
        this.intervalId = null;
        this.isRunning = false;
        this.lastSyncTime = null;
        this.nextSyncTime = null;
        
        // Carregar último tempo de sincronização
        this.loadLastSyncTime();
        
        // Iniciar serviço automaticamente
        this.start();
    }

    // Verificar se está dentro do horário de funcionamento (06:00 - 22:00 São Paulo)
    isWithinOperatingHours() {
        const now = new Date();
        // Converter para horário de São Paulo (GMT-3)
        const saoPauloTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
        const hour = saoPauloTime.getHours();
        
        return hour >= 6 && hour < 22;
    }

    // Calcular próximo horário de sincronização
    calculateNextSyncTime() {
        const now = new Date();
        const next = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // +2 horas
        
        // Se o próximo horário for fora do funcionamento, agendar para 06:00 do próximo dia
        const saoPauloNext = new Date(next.getTime() - (3 * 60 * 60 * 1000));
        if (saoPauloNext.getHours() >= 22 || saoPauloNext.getHours() < 6) {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0); // 06:00 São Paulo = 09:00 UTC
            return tomorrow;
        }
        
        return next;
    }

    // Executar sincronização
    async performSync() {
        if (!this.isWithinOperatingHours()) {
            console.log('🕐 Fora do horário de funcionamento (06:00 - 22:00 SP). Pulando sincronização...');
            return;
        }

        try {
            console.log('🔄 Iniciando sincronização automática...');
            
            // Verificar status atual
            const checkResult = await checkFollowUpSync();
            console.log(`📊 Status: ${checkResult.supabaseTotal}/${checkResult.sprintHubTotal} sincronizadas`);
            
            // Se houver dados faltando, sincronizar
            if (checkResult.missing > 0) {
                console.log(`⚠️ Encontradas ${checkResult.missing} oportunidades faltando. Sincronizando...`);
                
                const syncResult = await syncFollowUpStage();
                
                if (syncResult.success) {
                    console.log(`✅ Sincronização concluída: ${syncResult.inserted} inseridas, ${syncResult.updated} atualizadas`);
                    
                    // Atualizar tempo da última sincronização
                    this.lastSyncTime = new Date();
                    this.saveLastSyncTime();
                    
                    // Disparar evento para componentes interessados
                    this.notifyComponents();
                } else {
                    console.error('❌ Erro na sincronização:', syncResult.error);
                }
            } else {
                console.log('✅ Dados já estão sincronizados. Nenhuma ação necessária.');
                
                // Atualizar tempo mesmo se não sincronizou
                this.lastSyncTime = new Date();
                this.saveLastSyncTime();
                this.notifyComponents();
            }
            
        } catch (error) {
            console.error('❌ Erro na sincronização automática:', error);
        }
        
        // Calcular próxima sincronização
        this.nextSyncTime = this.calculateNextSyncTime();
        console.log(`⏰ Próxima sincronização agendada para: ${this.nextSyncTime.toLocaleString('pt-BR')}`);
    }

    // Notificar componentes sobre atualização
    notifyComponents() {
        const event = new CustomEvent('syncStatusUpdated', {
            detail: {
                lastSyncTime: this.lastSyncTime,
                nextSyncTime: this.nextSyncTime
            }
        });
        window.dispatchEvent(event);
    }

    // Iniciar serviço
    start() {
        if (this.isRunning) {
            console.log('⚠️ Serviço de sincronização já está rodando');
            return;
        }

        this.isRunning = true;
        console.log('🚀 Iniciando serviço de sincronização automática...');

        // Executar primeira sincronização imediatamente se estiver no horário
        if (this.isWithinOperatingHours()) {
            setTimeout(() => this.performSync(), 5000); // Aguarda 5s para app inicializar
        }

        // Configurar intervalo de verificação a cada 30 minutos
        this.intervalId = setInterval(() => {
            const now = new Date();
            
            // Se não há próxima sincronização agendada ou já passou do horário
            if (!this.nextSyncTime || now >= this.nextSyncTime) {
                this.performSync();
            }
            
        }, 30 * 60 * 1000); // Verificar a cada 30 minutos

        console.log('✅ Serviço de sincronização automática iniciado');
        console.log('⏰ Funcionamento: 06:00 - 22:00 (São Paulo) | Intervalo: 2 horas');
    }

    // Parar serviço
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.isRunning = false;
        console.log('⏹️ Serviço de sincronização automática parado');
    }

    // Forçar sincronização manual
    async forcSync() {
        console.log('🔄 Sincronização manual iniciada...');
        await this.performSync();
    }

    // Salvar tempo da última sincronização
    saveLastSyncTime() {
        if (this.lastSyncTime) {
            localStorage.setItem('lastSyncTime', this.lastSyncTime.toISOString());
        }
    }

    // Carregar tempo da última sincronização
    loadLastSyncTime() {
        const saved = localStorage.getItem('lastSyncTime');
        if (saved) {
            this.lastSyncTime = new Date(saved);
        }
    }

    // Obter status atual
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastSyncTime: this.lastSyncTime,
            nextSyncTime: this.nextSyncTime,
            isWithinOperatingHours: this.isWithinOperatingHours()
        };
    }
}

// Instância singleton do serviço
const autoSyncService = new AutoSyncService();

export default autoSyncService;