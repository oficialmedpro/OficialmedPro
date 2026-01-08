// 📊 Sistema de Analytics para Pré-Checkout
// Suporta Google Analytics 4 (GA4) e Facebook Pixel

(function() {
    'use strict';

    // Configuração (pode ser injetada via variáveis de ambiente ou config.js)
    const ENV_CONFIG = window.ENV_CONFIG || {};
    const CONFIG_FALLBACK = window.CONFIG || {};
    
    const GA4_MEASUREMENT_ID = ENV_CONFIG.VITE_GA4_MEASUREMENT_ID || 
                                CONFIG_FALLBACK.GA4_MEASUREMENT_ID || 
                                null;
    
    const FACEBOOK_PIXEL_ID = ENV_CONFIG.VITE_FACEBOOK_PIXEL_ID || 
                               CONFIG_FALLBACK.FACEBOOK_PIXEL_ID || 
                               null;

    // Verificar se GA4 está disponível
    const hasGA4 = typeof gtag !== 'undefined' || GA4_MEASUREMENT_ID;
    
    // Verificar se Facebook Pixel está disponível
    const hasFacebookPixel = typeof fbq !== 'undefined' || FACEBOOK_PIXEL_ID;

    /**
     * Função principal para rastrear eventos
     * @param {string} eventName - Nome do evento
     * @param {object} eventData - Dados do evento
     */
    function trackEvent(eventName, eventData = {}) {
        try {
            // Google Analytics 4
            if (hasGA4) {
                if (typeof gtag !== 'undefined') {
                    gtag('event', eventName, eventData);
                } else if (window.dataLayer) {
                    window.dataLayer.push({
                        'event': eventName,
                        ...eventData
                    });
                }
            }

            // Facebook Pixel
            if (hasFacebookPixel && typeof fbq !== 'undefined') {
                fbq('track', eventName, eventData);
            }

            // Log no console (apenas em desenvolvimento)
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('📊 Analytics Event:', eventName, eventData);
            }
        } catch (error) {
            console.error('❌ Erro ao rastrear evento:', error);
        }
    }

    /**
     * Rastrear visualização de página
     */
    function trackPageView(pageData = {}) {
        const defaultData = {
            page_title: document.title,
            page_location: window.location.href,
            page_path: window.location.pathname
        };

        trackEvent('page_view', { ...defaultData, ...pageData });
    }

    /**
     * Rastrear tempo na página
     */
    let timeOnPageStart = Date.now();
    let timeMilestones = [10, 30, 60, 120]; // segundos
    let milestonesTracked = new Set();

    function trackTimeOnPage() {
        const seconds = Math.floor((Date.now() - timeOnPageStart) / 1000);
        
        timeMilestones.forEach(milestone => {
            if (seconds >= milestone && !milestonesTracked.has(milestone)) {
                milestonesTracked.add(milestone);
                trackEvent('time_on_page', {
                    seconds: milestone,
                    milestone: milestone
                });
            }
        });
    }

    // Rastrear tempo a cada 5 segundos
    setInterval(trackTimeOnPage, 5000);

    /**
     * Rastrear profundidade de scroll
     */
    let scrollMilestones = [25, 50, 75, 100];
    let scrollMilestonesTracked = new Set();

    function trackScrollDepth() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollPercentage = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);

        scrollMilestones.forEach(milestone => {
            if (scrollPercentage >= milestone && !scrollMilestonesTracked.has(milestone)) {
                scrollMilestonesTracked.add(milestone);
                trackEvent('scroll_depth', {
                    depth_percentage: milestone,
                    scroll_position: scrollTop
                });
            }
        });
    }

    // Rastrear scroll
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(trackScrollDepth, 100);
    });

    /**
     * Rastrear abandono de carrinho
     */
    function trackCartAbandonment(cartData = {}) {
        const timeOnPage = Math.floor((Date.now() - timeOnPageStart) / 1000);
        
        trackEvent('cart_abandonment', {
            time_on_page: timeOnPage,
            ...cartData
        });
    }

    // Rastrear abandono ao sair da página
    window.addEventListener('beforeunload', () => {
        // Verificar se não finalizou compra
        const btnFinalizar = document.getElementById('btn-finalizar');
        if (btnFinalizar && !btnFinalizar.disabled) {
            // Tentar enviar evento (pode não funcionar em todos os browsers)
            if (navigator.sendBeacon) {
                const data = JSON.stringify({
                    event: 'cart_abandonment',
                    time_on_page: Math.floor((Date.now() - timeOnPageStart) / 1000)
                });
                navigator.sendBeacon('/api/analytics', data);
            }
        }
    });

    // Expor funções globalmente
    window.trackEvent = trackEvent;
    window.trackPageView = trackPageView;
    window.trackCartAbandonment = trackCartAbandonment;

    // Auto-track page view quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Aguardar um pouco para garantir que os dados estão carregados
            setTimeout(() => {
                trackPageView();
            }, 500);
        });
    } else {
        setTimeout(() => {
            trackPageView();
        }, 500);
    }

})();
