/**
 * 🕐 SERVIÇO DE SINCRONIZAÇÃO AGENDADA
 * 
 * Executa sincronização automática nos horários específicos:
 * 8:00, 9:50, 11:50, 13:50, 15:50, 17:50, 19:50, 20:50 (horário de Brasília - GMT-3)
 * 
 * Funciona tanto no frontend quanto no backend
 */

import notificationService from './notificationService.js';

class ScheduledSyncService {
    constructor() {
        this.intervalId = null;
        this.isRunning = false;
        this.lastSyncTime = null;
        this.nextSyncTime = null;
        this.syncTimes = [
            { hour: 8, minute: 0 },   // 8:00
            { hour: 9, minute: 50 },  // 9:50
            { hour: 11, minute: 50 }, // 11:50
            { hour: 13, minute: 50 }, // 13:50
            { hour: 15, minute: 50 }, // 15:50
            { hour: 17, minute: 50 }, // 17:50
            { hour: 19, minute: 50 }, // 19:50
            { hour: 20, minute: 50 }  // 20:50
        ];
        
        // Carregar último tempo de sincronização
        this.loadLastSyncTime();
    }

    // Verificar se está dentro do horário de funcionamento
    isWithinOperatingHours() {
        const now = new Date();
        // Converter para horário de Brasília (GMT-3)
        const brasiliaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
        const hour = brasiliaTime.getHours();
        const minute = brasiliaTime.getMinutes();
        
        // Verificar se está em um dos horários de sincronização
        return this.syncTimes.some(time => 
            hour === time.hour && minute === time.minute
        );
    }

    // Calcular próximo horário de sincronização
    calculateNextSyncTime() {
        const now = new Date();
        const brasiliaNow = new Date(now.getTime() - (3 * 60 * 60 * 1000));
        
        // Encontrar o próximo horário de sincronização
        for (const syncTime of this.syncTimes) {
            const nextSync = new Date(brasiliaNow);
            nextSync.setHours(syncTime.hour, syncTime.minute, 0, 0);
            
            // Se o horário ainda não passou hoje
            if (nextSync > brasiliaNow) {
                // Converter de volta para UTC
                return new Date(nextSync.getTime() + (3 * 60 * 60 * 1000));
            }
        }
        
        // Se não há mais horários hoje, agendar para o primeiro horário de amanhã
        const tomorrow = new Date(brasiliaNow);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(this.syncTimes[0].hour, this.syncTimes[0].minute, 0, 0);
        
        // Converter de volta para UTC
        return new Date(tomorrow.getTime() + (3 * 60 * 60 * 1000));
    }

    // Executar sincronização via API
    async performSync() {
        try {
            console.log('🔄 Iniciando sincronização automática agendada...');
            
            // Notificar início da sincronização
            notificationService.notifySyncStarted();
            
            // Chamar endpoint de sincronização
            const response = await fetch('/api/sync-now', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source: 'scheduled_sync',
                    timestamp: new Date().toISOString()
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Sincronização automática concluída:', result);
                
                // Atualizar tempo da última sincronização
                this.lastSyncTime = new Date();
                this.saveLastSyncTime();
                
                // Notificar sucesso
                notificationService.notifySyncCompleted(true, `Processadas: ${result.result?.totalProcessed || 'N/A'}`);
                
                // Disparar evento para componentes interessados
                this.notifyComponents();
                
                return { success: true, result };
            } else {
                console.error('❌ Erro na sincronização automática:', response.status);
                
                // Notificar erro
                notificationService.notifySyncCompleted(false, `HTTP ${response.status}`);
                
                return { success: false, error: `HTTP ${response.status}` };
            }
            
        } catch (error) {
            console.error('❌ Erro na sincronização automática:', error);
            
            // Notificar erro
            notificationService.notifySyncCompleted(false, error.message);
            
            return { success: false, error: error.message };
        }
    }

    // Verificar se é hora de sincronizar
    shouldSyncNow() {
        const now = new Date();
        const brasiliaNow = new Date(now.getTime() - (3 * 60 * 60 * 1000));
        const hour = brasiliaNow.getHours();
        const minute = brasiliaNow.getMinutes();
        
        // Verificar se está em um dos horários de sincronização
        return this.syncTimes.some(time => 
            hour === time.hour && minute === time.minute
        );
    }

    // Notificar componentes sobre atualização
    notifyComponents() {
        const event = new CustomEvent('scheduledSyncUpdated', {
            detail: {
                lastSyncTime: this.lastSyncTime,
                nextSyncTime: this.nextSyncTime,
                isRunning: this.isRunning
            }
        });
        window.dispatchEvent(event);
    }

    // Iniciar serviço
    start() {
        if (this.isRunning) {
            console.log('⚠️ Serviço de sincronização agendada já está rodando');
            return;
        }

        this.isRunning = true;
        console.log('🚀 Iniciando serviço de sincronização agendada...');
        console.log('⏰ Horários: 8:00, 9:50, 11:50, 13:50, 15:50, 17:50, 19:50, 20:50 (Brasília)');

        // Calcular próxima sincronização
        this.nextSyncTime = this.calculateNextSyncTime();
        console.log(`⏰ Próxima sincronização: ${this.nextSyncTime.toLocaleString('pt-BR')}`);

        // Notificar sobre o agendamento
        notificationService.notifySyncScheduled(this.nextSyncTime);

        // Verificar a cada minuto se é hora de sincronizar
        this.intervalId = setInterval(() => {
            if (this.shouldSyncNow()) {
                this.performSync();
            }
        }, 60000); // Verificar a cada minuto

        console.log('✅ Serviço de sincronização agendada iniciado');
    }

    // Parar serviço
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.isRunning = false;
        console.log('⏹️ Serviço de sincronização agendada parado');
        
        // Notificar sobre a parada
        notificationService.notifySyncStopped();
    }

    // Forçar sincronização manual
    async forceSync() {
        console.log('🔄 Sincronização manual iniciada...');
        return await this.performSync();
    }

    // Salvar tempo da última sincronização
    saveLastSyncTime() {
        if (this.lastSyncTime) {
            localStorage.setItem('lastScheduledSyncTime', this.lastSyncTime.toISOString());
        }
    }

    // Carregar tempo da última sincronização
    loadLastSyncTime() {
        const saved = localStorage.getItem('lastScheduledSyncTime');
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
            syncTimes: this.syncTimes,
            shouldSyncNow: this.shouldSyncNow()
        };
    }

    // Obter próximos horários de sincronização
    getNextSyncTimes() {
        const now = new Date();
        const brasiliaNow = new Date(now.getTime() - (3 * 60 * 60 * 1000));
        const nextTimes = [];
        
        for (const syncTime of this.syncTimes) {
            const nextSync = new Date(brasiliaNow);
            nextSync.setHours(syncTime.hour, syncTime.minute, 0, 0);
            
            // Se o horário ainda não passou hoje
            if (nextSync > brasiliaNow) {
                nextTimes.push({
                    time: syncTime,
                    date: new Date(nextSync.getTime() + (3 * 60 * 60 * 1000)), // Converter para UTC
                    formatted: nextSync.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })
                });
            }
        }
        
        // Se não há mais horários hoje, adicionar o primeiro de amanhã
        if (nextTimes.length === 0) {
            const tomorrow = new Date(brasiliaNow);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(this.syncTimes[0].hour, this.syncTimes[0].minute, 0, 0);
            
            nextTimes.push({
                time: this.syncTimes[0],
                date: new Date(tomorrow.getTime() + (3 * 60 * 60 * 1000)), // Converter para UTC
                formatted: tomorrow.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })
            });
        }
        
        return nextTimes;
    }
}

// Instância singleton do serviço
const scheduledSyncService = new ScheduledSyncService();

export default scheduledSyncService;
