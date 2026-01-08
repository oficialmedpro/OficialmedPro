// IIFE para evitar conflitos de escopo e redeclarações
(function() {
    'use strict';

    // Configuração (carrega de variáveis de ambiente injetadas ou config.js ou valores padrão)
    const ENV_CONFIG = window.ENV_CONFIG || {};
    const CONFIG_FALLBACK = window.CONFIG || {};

    const SUPABASE_URL = ENV_CONFIG.VITE_SUPABASE_URL || CONFIG_FALLBACK.SUPABASE_URL || 'https://agdffspstbxeqhqtltvb.supabase.co';
    const SUPABASE_KEY = ENV_CONFIG.VITE_SUPABASE_KEY || CONFIG_FALLBACK.SUPABASE_KEY || '';
    const SUPABASE_SCHEMA = ENV_CONFIG.VITE_SUPABASE_SCHEMA || CONFIG_FALLBACK.SUPABASE_SCHEMA || 'api';
    const API_URL = ENV_CONFIG.VITE_API_URL || CONFIG_FALLBACK.API_URL || window.location.origin;
    const N8N_WEBHOOK_URL = ENV_CONFIG.VITE_N8N_WEBHOOK_URL || CONFIG_FALLBACK.N8N_WEBHOOK_URL || 'https://seu-n8n.com/webhook-pagina-precheckout';

    // Validar configuração
    if (!SUPABASE_KEY || SUPABASE_KEY === 'COLE_SUA_CHAVE_ANON_AQUI') {
        console.error('❌ Erro: Configure a chave do Supabase no arquivo config.js');
        const errorEl = document.getElementById('error');
        const errorMessageEl = document.getElementById('error-message');
        const loadingEl = document.getElementById('loading');
        if (errorEl && errorMessageEl && loadingEl) {
            errorEl.style.display = 'block';
            errorMessageEl.textContent = 'Erro de configuração: Chave do Supabase não configurada. Edite o arquivo config.js';
            loadingEl.style.display = 'none';
        }
        return;
    }

    // Inicializar Supabase (usando schema configurado)
    // Verificar se já foi inicializado para evitar redeclaração
    if (typeof window.supabaseClient === 'undefined') {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            db: {
                schema: SUPABASE_SCHEMA
            }
        });
    }
    const supabase = window.supabaseClient;

    // Estados
    let orcamentoData = null;
    let formulasSelecionadas = new Set();

    // Funções
    // Garantir título correto da página
    if (document && document.title !== 'Orçamento OficialMed') {
        document.title = 'Orçamento OficialMed';
    }
    function formatarValor(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    function obterLinkId() {
        const path = window.location.pathname;
        const match = path.match(/\/pre-checkout\/([^\/]+)/);
        return match ? match[1] : null;
    }

    function obterLinkIdDaUrl() {
        // Tenta pegar da URL atual
        const params = new URLSearchParams(window.location.search);
        const linkId = params.get('link') || obterLinkId();
        
        // Se não encontrou, tenta pegar do pathname
        if (!linkId) {
            const pathParts = window.location.pathname.split('/');
            const index = pathParts.indexOf('pre-checkout');
            if (index !== -1 && pathParts[index + 1]) {
                return pathParts[index + 1];
            }
        }
        
        return linkId;
    }

    async function carregarPreCheckout() {
        const loadingEl = document.getElementById('loading');
        const errorEl = document.getElementById('error');
        const contentEl = document.getElementById('content');
        const splashEl = document.getElementById('splash');
        const errorMessageEl = document.getElementById('error-message');

        try {
            loadingEl.style.display = 'block';
            errorEl.style.display = 'none';
            contentEl.style.display = 'none';
            if (splashEl) splashEl.style.display = 'none';

            const linkId = obterLinkIdDaUrl();
            
            if (!linkId) {
                // Sem linkId: mostrar splash de apresentação
                loadingEl.style.display = 'none';
                if (splashEl) splashEl.style.display = 'block';
                // Rastrear visualização do splash
                if (typeof window.trackEvent === 'function') {
                    window.trackEvent('splash_view', {
                        page_location: window.location.href
                    });
                }
                return;
            }

            // Buscar dados do Supabase (schema configurado)
            const { data, error } = await supabase
                .schema(SUPABASE_SCHEMA)
                .from('pre_checkout')
                .select('*')
                .eq('link_pre_checkout', linkId)
                .single();

            if (error) {
                throw new Error(error.message || 'Pré-checkout não encontrado');
            }

            if (!data) {
                throw new Error('Pré-checkout não encontrado');
            }

            // Verificar se expirou
            if (data.expires_at) {
                const expiresAt = new Date(data.expires_at);
                const now = new Date();
                if (now > expiresAt) {
                    // Rastrear link expirado
                    if (typeof window.trackEvent === 'function') {
                        window.trackEvent('link_expired', {
                            link_id: linkId,
                            expires_at: data.expires_at
                        });
                    }
                    throw new Error('Este link de pré-checkout expirou');
                }
            }

            orcamentoData = data;

            // Inicializar fórmulas selecionadas (todas por padrão)
            if (data.formulas_selecionadas && Array.isArray(data.formulas_selecionadas)) {
                formulasSelecionadas = new Set(data.formulas_selecionadas);
            } else {
                formulasSelecionadas = new Set(data.dados_orcamento.formulas.map(f => f.numero));
            }

            renderizarPagina();
            
            loadingEl.style.display = 'none';
            contentEl.style.display = 'block';

            // Rastrear visualização da página com dados do orçamento
            if (typeof window.trackPageView === 'function') {
                window.trackPageView({
                    link_id: linkId,
                    orcamento_codigo: data.dados_orcamento?.codigo || 'N/A',
                    cliente: data.dados_orcamento?.cliente || 'N/A',
                    quantidade_formulas: data.dados_orcamento?.formulas?.length || 0
                });
            }

        } catch (err) {
            console.error('Erro ao carregar pré-checkout:', err);
            loadingEl.style.display = 'none';
            // Em caso de erro (ex.: link inválido/expirado), mantém mensagem de erro
            errorEl.style.display = 'block';
            errorMessageEl.textContent = err.message;
            
            // Rastrear erro
            if (typeof window.trackEvent === 'function') {
                const errorType = err.message.includes('expirado') ? 'link_expirado' : 
                                 err.message.includes('não encontrado') ? 'link_invalido' : 
                                 'erro_carregamento';
                window.trackEvent('page_load_error', {
                    error_type: errorType,
                    error_message: err.message,
                    link_id: obterLinkIdDaUrl() || 'N/A'
                });
            }
        }
    }

    function toggleFormula(numero) {
        const formula = orcamentoData?.dados_orcamento?.formulas?.find(f => f.numero === numero);
        const wasSelected = formulasSelecionadas.has(numero);
        
        if (wasSelected) {
            formulasSelecionadas.delete(numero);
        } else {
            formulasSelecionadas.add(numero);
        }
        
        atualizarCheckboxes();
        calcularEAtualizarTotal();
        
        // Rastrear seleção/deseleção
        if (typeof window.trackEvent === 'function' && formula) {
            const eventName = wasSelected ? 'formula_deselect' : 'formula_select';
            window.trackEvent(eventName, {
                formula_numero: numero,
                formula_valor: formula.valor || 0,
                total_formulas_selecionadas: formulasSelecionadas.size,
                subtotal: calcularSubtotal()
            });
        }
    }

    function atualizarCheckboxes() {
        document.querySelectorAll('.formula-item').forEach(item => {
            const numero = parseInt(item.dataset.numero);
            const checkbox = item.querySelector('.checkbox-custom');
            const isSelecionada = formulasSelecionadas.has(numero);
            
            if (isSelecionada) {
                checkbox.classList.add('checked');
                item.classList.add('selecionada');
            } else {
                checkbox.classList.remove('checked');
                item.classList.remove('selecionada');
            }
        });
    }

    function calcularSubtotal() {
        if (!orcamentoData || !orcamentoData.dados_orcamento) return 0;
        
        return orcamentoData.dados_orcamento.formulas
            .filter(f => formulasSelecionadas.has(f.numero))
            .reduce((sum, f) => sum + (f.valor || 0), 0);
    }

    function calcularFrete(subtotal) {
        // Garantir que subtotal é um número
        const valor = Number(subtotal) || 0;
        // Frete grátis para compras acima ou igual a R$ 300,00
        // Frete de R$ 30,00 para compras abaixo de R$ 300,00
        return valor >= 300 ? 0 : 30;
    }

    // Variável para rastrear se frete grátis já foi atingido
    let freteGratisJaRastreado = false;

    function calcularEAtualizarTotal() {
        const subtotal = calcularSubtotal();
        const frete = calcularFrete(subtotal);
        const total = subtotal + frete;
        const qtdProdutos = formulasSelecionadas.size;
        
        const totalValueEl = document.getElementById('total-value');
        const resumoProdutosEl = document.getElementById('resumo-produtos');
        const resumoFreteValueEl = document.getElementById('resumo-frete-value');
        const btnFinalizar = document.getElementById('btn-finalizar');
        
        // Atualizar total final (sempre produtos + frete)
        if (totalValueEl) {
            totalValueEl.textContent = formatarValor(total);
        }
        
        // Atualizar subtotal de produtos
        if (resumoProdutosEl) {
            resumoProdutosEl.textContent = formatarValor(subtotal);
            
            // Atualizar texto "1 Produto" para quantidade correta
            const resumoLabelEl = resumoProdutosEl.previousElementSibling.previousElementSibling;
            if (resumoLabelEl && resumoLabelEl.textContent.includes('Produto')) {
                resumoLabelEl.textContent = `${qtdProdutos} ${qtdProdutos === 1 ? 'Produto' : 'Produtos'}`;
            }
        }
        
        // Atualizar valor do frete (mostrar "Grátis" quando for 0)
        if (resumoFreteValueEl) {
            if (frete === 0) {
                resumoFreteValueEl.textContent = 'Grátis';
                resumoFreteValueEl.classList.add('frete-gratis');
            } else {
                resumoFreteValueEl.textContent = formatarValor(frete);
                resumoFreteValueEl.classList.remove('frete-gratis');
                freteGratisJaRastreado = false; // Reset quando frete volta a ser pago
            }
        }
        
        // Habilitar/desabilitar botão de finalizar
        if (btnFinalizar) {
            btnFinalizar.disabled = formulasSelecionadas.size === 0;
        }
        
        // Rastrear eventos de cálculo
        if (typeof window.trackEvent === 'function') {
            // Rastrear cálculo de frete
            window.trackEvent('frete_calculated', {
                subtotal: subtotal,
                frete: frete,
                frete_gratis: frete === 0,
                total: total
            });
            
            // Rastrear atualização de total
            window.trackEvent('total_updated', {
                subtotal: subtotal,
                frete: frete,
                total: total,
                quantidade_produtos: qtdProdutos
            });
            
            // Rastrear quando atinge frete grátis (apenas uma vez)
            if (frete === 0 && !freteGratisJaRastreado && subtotal > 0) {
                freteGratisJaRastreado = true;
                window.trackEvent('frete_gratis_achieved', {
                    subtotal: subtotal,
                    total: total,
                    quantidade_produtos: qtdProdutos
                });
            }
        }
    }

    async function finalizarCompra() {
        const btnFinalizar = document.getElementById('btn-finalizar');
        
        if (formulasSelecionadas.size === 0) {
            // Rastrear tentativa de finalizar sem produtos
            if (typeof window.trackEvent === 'function') {
                window.trackEvent('formula_selection_validation', {
                    error: 'nenhuma_formula_selecionada',
                    formulas_disponiveis: orcamentoData?.dados_orcamento?.formulas?.length || 0
                });
            }
            alert('Selecione pelo menos uma fórmula para continuar');
            return;
        }

        // Calcular valores antes de rastrear
        const subtotal = calcularSubtotal();
        const frete = calcularFrete(subtotal);
        const valorTotal = subtotal + frete;

        // Rastrear clique em finalizar
        if (typeof window.trackEvent === 'function') {
            window.trackEvent('finalizar_compra_click', {
                subtotal: subtotal,
                frete: frete,
                total: valorTotal,
                quantidade_produtos: formulasSelecionadas.size,
                formulas_selecionadas: Array.from(formulasSelecionadas)
            });
        }

        try {
            if (btnFinalizar) {
                btnFinalizar.disabled = true;
                btnFinalizar.textContent = 'Gerando checkout...';
            }

            const linkId = obterLinkIdDaUrl();
            
            if (!linkId) {
                throw new Error('Link ID não encontrado');
            }

            // Atualizar fórmulas selecionadas no Supabase (schema configurado)
            const { error: updateError } = await supabase
                .schema(SUPABASE_SCHEMA)
                .from('pre_checkout')
                .update({
                    formulas_selecionadas: Array.from(formulasSelecionadas),
                    // Mantém status válido conforme constraint do banco
                    status: 'pendente',
                    updated_at: new Date().toISOString()
                })
                .eq('link_pre_checkout', linkId);

            if (updateError) {
                throw new Error(updateError.message);
            }

            // Calcular valores para enviar ao webhook
            const subtotal = calcularSubtotal();
            const frete = calcularFrete(subtotal);
            const valorTotal = subtotal + frete; // Total com frete incluído

            // Chamar webhook do n8n para gerar checkout
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    linkId: linkId,
                    formulasSelecionadas: Array.from(formulasSelecionadas),
                    valor: valorTotal // Envia o valor total já com frete incluído
                })
            });

            if (!response.ok) {
                let detalhe = '';
                try {
                    // tenta extrair detalhes de erro do n8n
                    detalhe = await response.text();
                } catch {}
                throw new Error(`Erro ao gerar checkout: ${response.status} ${detalhe || response.statusText || ''}`.trim());
            }

            const data = await response.json();
            
            if (!data.success || !data.checkout_url) {
                throw new Error('Resposta inválida do servidor');
            }

            // Rastrear sucesso na geração do checkout
            if (typeof window.trackEvent === 'function') {
                window.trackEvent('finalizar_compra_success', {
                    checkout_url: data.checkout_url,
                    subtotal: subtotal,
                    frete: frete,
                    total: valorTotal
                });
            }

            // Rastrear redirecionamento
            if (typeof window.trackEvent === 'function') {
                window.trackEvent('checkout_redirect', {
                    checkout_url: data.checkout_url,
                    total: valorTotal
                });
            }

            // Redirecionar para o checkout
            window.location.href = data.checkout_url;

        } catch (err) {
            console.error('Erro ao finalizar:', err);
            
            // Rastrear erro ao finalizar
            if (typeof window.trackEvent === 'function') {
                window.trackEvent('finalizar_compra_error', {
                    error_message: err.message,
                    subtotal: subtotal,
                    frete: frete,
                    total: valorTotal
                });
            }
            
            alert('Erro ao processar. Tente novamente.');
            
            if (btnFinalizar) {
                btnFinalizar.disabled = false;
                btnFinalizar.textContent = 'Finalizar Compra';
            }
        }
    }

    function renderizarPagina() {
        if (!orcamentoData || !orcamentoData.dados_orcamento) return;

        const orcamento = orcamentoData.dados_orcamento;

        // Atualizar informações do orçamento
        document.getElementById('codigo-orcamento').textContent = orcamento.codigo || 'N/A';
        document.getElementById('nome-cliente').textContent = orcamento.cliente || 'Cliente';

        // Renderizar fórmulas
        const formulasContainer = document.getElementById('formulas-container');
        formulasContainer.innerHTML = '';

        orcamento.formulas.forEach((formula) => {
            const formulaEl = document.createElement('div');
            formulaEl.className = 'formula-item';
            formulaEl.dataset.numero = formula.numero;
            
            const isSelecionada = formulasSelecionadas.has(formula.numero);
            if (isSelecionada) {
                formulaEl.classList.add('selecionada');
            }

            formulaEl.innerHTML = `
                <div class="formula-checkbox">
                    <div class="checkbox-custom ${isSelecionada ? 'checked' : ''}"></div>
                </div>
                <div class="formula-content">
                    <div class="formula-header">
                        <span class="formula-numero">Fórmula nº ${formula.numero}</span>
                        <span class="formula-valor">${formatarValor(formula.valor || 0)}</span>
                    </div>
                    ${formula.quantidade ? `<p class="formula-quantidade">${formula.quantidade}</p>` : ''}
                    <p class="formula-descricao">${formula.descricao || 'Sem descrição'}</p>
                </div>
            `;

            formulaEl.addEventListener('click', () => toggleFormula(formula.numero));
            
            formulasContainer.appendChild(formulaEl);
        });

        // Atualizar total
        calcularEAtualizarTotal();
        
        // Atualizar resumo de produtos
        const qtdProdutos = formulasSelecionadas.size;
        const resumoLabelEl = document.querySelector('.resumo-line .resumo-label');
        if (resumoLabelEl && resumoLabelEl.textContent.includes('Produto')) {
            resumoLabelEl.textContent = `${qtdProdutos} ${qtdProdutos === 1 ? 'Produto' : 'Produtos'}`;
        }
    }

    // Inicializar quando a página carregar
    document.addEventListener('DOMContentLoaded', () => {
        carregarPreCheckout();
        
        // Adicionar listener ao botão de finalizar
        const btnFinalizar = document.getElementById('btn-finalizar');
        if (btnFinalizar) {
            btnFinalizar.addEventListener('click', finalizarCompra);
        }

        // Controles de fonte (usa rem via --base-font-size)
        // Limites: 0.75 (75%) a 2.0 (200%)
        let fontScale = parseFloat(localStorage.getItem('precheckout_font_scale') || '1');
        
        // Garantir que está dentro dos limites ao carregar
        fontScale = Math.max(0.75, Math.min(fontScale, 2.0));
        
        function aplicarFonte() {
            const base = 16 * fontScale;
            document.documentElement.style.setProperty('--base-font-size', `${base}px`);
            // Forçar atualização do body também
            document.body.style.fontSize = `${base}px`;
        }
        aplicarFonte();

        const btnMinus = document.getElementById('decrease-font');
        const btnPlus = document.getElementById('increase-font');
        
        if (btnMinus) {
            btnMinus.addEventListener('click', () => {
                fontScale = Math.max(0.75, fontScale - 0.1);
                localStorage.setItem('precheckout_font_scale', String(fontScale));
                aplicarFonte();
                
                // Rastrear diminuição de fonte
                if (typeof window.trackEvent === 'function') {
                    window.trackEvent('font_decrease', {
                        font_scale: fontScale
                    });
                }
            });
        }
        
        if (btnPlus) {
            btnPlus.addEventListener('click', () => {
                fontScale = Math.min(2.0, fontScale + 0.1);
                localStorage.setItem('precheckout_font_scale', String(fontScale));
                aplicarFonte();
                
                // Rastrear aumento de fonte
                if (typeof window.trackEvent === 'function') {
                    window.trackEvent('font_increase', {
                        font_scale: fontScale
                    });
                }
            });
        }

        // Exportar imagem
        async function baixarImagem() {
            // Rastrear download de imagem
            if (typeof window.trackEvent === 'function') {
                window.trackEvent('download_image', {
                    orcamento_codigo: orcamentoData?.dados_orcamento?.codigo || 'N/A',
                    cliente: orcamentoData?.dados_orcamento?.cliente || 'N/A'
                });
            }
            
            const alvo = document.getElementById('root') || document.body;
            document.body.classList.add('exportando');
            window.scrollTo(0, 0);
            const canvas = await html2canvas(alvo, { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#ffffff',
                ignoreElements: (el) => el.classList?.contains('hide-export') || el.classList?.contains('no-print')
            });
            const dataURL = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataURL;
            const nome = (orcamentoData?.dados_orcamento?.codigo || orcamentoData?.codigo_orcamento || 'orcamento').toString();
            a.download = `pre-checkout-${nome}.png`;
            a.click();
            document.body.classList.remove('exportando');
        }

        // Exportar PDF
        async function baixarPDF() {
            // Rastrear download de PDF
            if (typeof window.trackEvent === 'function') {
                window.trackEvent('download_pdf', {
                    orcamento_codigo: orcamentoData?.dados_orcamento?.codigo || 'N/A',
                    cliente: orcamentoData?.dados_orcamento?.cliente || 'N/A'
                });
            }
            
            const alvo = document.getElementById('root') || document.body;
            document.body.classList.add('exportando');
            window.scrollTo(0, 0);
            const canvas = await html2canvas(alvo, { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#ffffff',
                ignoreElements: (el) => el.classList?.contains('hide-export') || el.classList?.contains('no-print')
            });
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new window.jspdf.jsPDF('p', 'pt', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = pageWidth;
            const imgHeight = canvas.height * (imgWidth / canvas.width);

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const nome = (orcamentoData?.dados_orcamento?.codigo || orcamentoData?.codigo_orcamento || 'orcamento').toString();
            pdf.save(`pre-checkout-${nome}.pdf`);
            document.body.classList.remove('exportando');
        }

        // Imprimir
        function imprimir() {
            // Rastrear impressão
            if (typeof window.trackEvent === 'function') {
                window.trackEvent('print_page', {
                    orcamento_codigo: orcamentoData?.dados_orcamento?.codigo || 'N/A',
                    cliente: orcamentoData?.dados_orcamento?.cliente || 'N/A'
                });
            }
            window.print();
        }

        const btnImg = document.getElementById('download-image');
        if (btnImg) btnImg.addEventListener('click', baixarImagem);
        const btnPdf = document.getElementById('download-pdf');
        if (btnPdf) btnPdf.addEventListener('click', baixarPDF);
        const btnPrint = document.getElementById('print-page');
        if (btnPrint) btnPrint.addEventListener('click', imprimir);

        // Rastrear cliques em badges
        document.querySelectorAll('.badge a, .qrcode-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const badgeType = link.closest('.badge')?.className.match(/badge-(\w+)/)?.[1] || 'unknown';
                const url = link.href || link.getAttribute('href');
                
                if (typeof window.trackEvent === 'function') {
                    if (badgeType === 'qrcode') {
                        window.trackEvent('franqueado_link_click', {
                            link_url: url
                        });
                    } else {
                        window.trackEvent('badge_click', {
                            badge_type: badgeType,
                            badge_url: url
                        });
                    }
                }
            });
        });
    });

    // Expor funções globalmente se necessário
    window.toggleFormula = toggleFormula;
    window.calcularSubtotal = calcularSubtotal;
    window.calcularFrete = calcularFrete;
    window.finalizarCompra = finalizarCompra;
})();
