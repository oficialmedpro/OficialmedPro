/**
 * 🔔 SERVIÇO DE NOTIFICAÇÕES
 * 
 * Gerencia notificações sobre sincronizações automáticas
 * e outras atividades do sistema
 */

class NotificationService {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 50;
        this.isSupported = 'Notification' in window;
        
        // Solicitar permissão para notificações
        this.requestPermission();
    }

    // Solicitar permissão para notificações
    async requestPermission() {
        if (!this.isSupported) {
            console.log('🔔 Notificações não suportadas neste navegador');
            return false;
        }

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return Notification.permission === 'granted';
    }

    // Criar notificação
    createNotification(title, options = {}) {
        if (!this.isSupported || Notification.permission !== 'granted') {
            // Fallback: mostrar no console
            console.log(`🔔 ${title}: ${options.body || ''}`);
            return null;
        }

        const notification = new Notification(title, {
            icon: '/vite.svg',
            badge: '/vite.svg',
            ...options
        });

        // Adicionar à lista de notificações
        this.addToHistory(title, options.body || '', 'success');

        // Auto-remover após 5 segundos
        setTimeout(() => {
            notification.close();
        }, 5000);

        return notification;
    }

    // Adicionar notificação ao histórico
    addToHistory(title, body, type = 'info') {
        const notification = {
            id: Date.now(),
            title,
            body,
            type,
            timestamp: new Date(),
            read: false
        };

        this.notifications.unshift(notification);

        // Manter apenas as últimas notificações
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.maxNotifications);
        }

        // Disparar evento para componentes interessados
        this.notifyComponents();
    }

    // Notificar componentes sobre mudanças
    notifyComponents() {
        const event = new CustomEvent('notificationsUpdated', {
            detail: {
                notifications: this.notifications,
                unreadCount: this.getUnreadCount()
            }
        });
        window.dispatchEvent(event);
    }

    // Obter notificações não lidas
    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }

    // Marcar notificação como lida
    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            this.notifyComponents();
        }
    }

    // Marcar todas como lidas
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.notifyComponents();
    }

    // Obter notificações
    getNotifications(limit = null) {
        return limit ? this.notifications.slice(0, limit) : this.notifications;
    }

    // Limpar notificações antigas
    clearOldNotifications() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        this.notifications = this.notifications.filter(
            n => new Date(n.timestamp) > oneWeekAgo
        );
        this.notifyComponents();
    }

    // Notificações específicas para sincronização
    notifySyncStarted() {
        this.createNotification('🔄 Sincronização Iniciada', {
            body: 'Sincronização automática iniciada nos horários agendados',
            tag: 'sync-started'
        });
    }

    notifySyncCompleted(success, details = '') {
        if (success) {
            this.createNotification('✅ Sincronização Concluída', {
                body: `Sincronização automática concluída com sucesso. ${details}`,
                tag: 'sync-completed'
            });
            this.addToHistory('Sincronização Concluída', details, 'success');
        } else {
            this.createNotification('❌ Erro na Sincronização', {
                body: `Erro na sincronização automática: ${details}`,
                tag: 'sync-error'
            });
            this.addToHistory('Erro na Sincronização', details, 'error');
        }
    }

    notifySyncScheduled(nextSyncTime) {
        const timeStr = nextSyncTime.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        this.createNotification('⏰ Sincronização Agendada', {
            body: `Próxima sincronização automática: ${timeStr}`,
            tag: 'sync-scheduled'
        });
    }

    notifySyncStopped() {
        this.createNotification('⏹️ Sincronização Parada', {
            body: 'Sincronização automática foi parada',
            tag: 'sync-stopped'
        });
    }

    // Notificações de sistema
    notifySystemError(message) {
        this.createNotification('🚨 Erro do Sistema', {
            body: message,
            tag: 'system-error'
        });
        this.addToHistory('Erro do Sistema', message, 'error');
    }

    notifySystemInfo(message) {
        this.createNotification('ℹ️ Informação', {
            body: message,
            tag: 'system-info'
        });
        this.addToHistory('Informação', message, 'info');
    }

    // Notificações de dados
    notifyDataUpdated(recordCount, type = 'oportunidades') {
        this.createNotification('📊 Dados Atualizados', {
            body: `${recordCount} ${type} foram atualizados`,
            tag: 'data-updated'
        });
        this.addToHistory('Dados Atualizados', `${recordCount} ${type}`, 'success');
    }

    // Notificações de performance
    notifyPerformanceWarning(message) {
        this.createNotification('⚠️ Aviso de Performance', {
            body: message,
            tag: 'performance-warning'
        });
        this.addToHistory('Aviso de Performance', message, 'warning');
    }
}

// Instância singleton do serviço
const notificationService = new NotificationService();

export default notificationService;
