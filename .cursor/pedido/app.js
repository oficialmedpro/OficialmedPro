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
        const errorMessageEl = document.getElementById('error-message');

        try {
            loadingEl.style.display = 'block';
            errorEl.style.display = 'none';
            contentEl.style.display = 'none';

            const linkId = obterLinkIdDaUrl();
            
            if (!linkId) {
                throw new Error('Link ID não encontrado na URL');
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

        } catch (err) {
            console.error('Erro ao carregar pré-checkout:', err);
            loadingEl.style.display = 'none';
            errorEl.style.display = 'block';
            errorMessageEl.textContent = err.message;
        }
    }

    function toggleFormula(numero) {
        if (formulasSelecionadas.has(numero)) {
            formulasSelecionadas.delete(numero);
        } else {
            formulasSelecionadas.add(numero);
        }
        
        atualizarCheckboxes();
        calcularEAtualizarTotal();
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

    function calcularTotal() {
        if (!orcamentoData || !orcamentoData.dados_orcamento) return 0;
        
        return orcamentoData.dados_orcamento.formulas
            .filter(f => formulasSelecionadas.has(f.numero))
            .reduce((sum, f) => sum + (f.valor || 0), 0);
    }

    function calcularEAtualizarTotal() {
        const total = calcularTotal();
        const totalValueEl = document.getElementById('total-value');
        const resumoProdutosEl = document.getElementById('resumo-produtos');
        const btnFinalizar = document.getElementById('btn-finalizar');
        
        if (totalValueEl) {
            totalValueEl.textContent = formatarValor(total);
        }
        
        if (resumoProdutosEl) {
            const qtdProdutos = formulasSelecionadas.size;
            resumoProdutosEl.textContent = formatarValor(total);
            
            // Atualizar texto "1 Produto" para quantidade correta
            const resumoLabelEl = resumoProdutosEl.previousElementSibling.previousElementSibling;
            if (resumoLabelEl && resumoLabelEl.textContent.includes('Produto')) {
                resumoLabelEl.textContent = `${qtdProdutos} ${qtdProdutos === 1 ? 'Produto' : 'Produtos'}`;
            }
        }
        
        // Habilitar/desabilitar botão de finalizar
        if (btnFinalizar) {
            btnFinalizar.disabled = formulasSelecionadas.size === 0;
        }
    }

    async function finalizarCompra() {
        const btnFinalizar = document.getElementById('btn-finalizar');
        
        if (formulasSelecionadas.size === 0) {
            alert('Selecione pelo menos uma fórmula para continuar');
            return;
        }

        try {
            if (btnFinalizar) {
                btnFinalizar.disabled = true;
                btnFinalizar.textContent = 'Processando...';
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
                    status: 'finalizado',
                    updated_at: new Date().toISOString()
                })
                .eq('link_pre_checkout', linkId);

            if (updateError) {
                throw new Error(updateError.message);
            }

            // Redirecionar para gerar checkout
            const checkoutUrl = `${API_URL}/api/pre-checkout/${linkId}/checkout`;
            window.location.href = checkoutUrl;

        } catch (err) {
            console.error('Erro ao finalizar:', err);
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
        let fontScale = parseFloat(localStorage.getItem('precheckout_font_scale') || '1');
        function aplicarFonte() {
            const base = 16 * Math.max(0.85, Math.min(fontScale, 1.4));
            document.documentElement.style.setProperty('--base-font-size', `${base}px`);
        }
        aplicarFonte();

        const btnMinus = document.getElementById('decrease-font');
        const btnPlus = document.getElementById('increase-font');
        if (btnMinus) {
            btnMinus.addEventListener('click', () => {
                fontScale = Math.max(0.85, fontScale - 0.05);
                localStorage.setItem('precheckout_font_scale', String(fontScale));
                aplicarFonte();
            });
        }
        if (btnPlus) {
            btnPlus.addEventListener('click', () => {
                fontScale = Math.min(1.4, fontScale + 0.05);
                localStorage.setItem('precheckout_font_scale', String(fontScale));
                aplicarFonte();
            });
        }

        // Exportar imagem
        async function baixarImagem() {
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
            const nome = (orcamentoData?.codigo_orcamento || 'orcamento').toString();
            a.download = `pre-checkout-${nome}.png`;
            a.click();
            document.body.classList.remove('exportando');
        }

        // Exportar PDF
        async function baixarPDF() {
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

            const nome = (orcamentoData?.codigo_orcamento || 'orcamento').toString();
            pdf.save(`pre-checkout-${nome}.pdf`);
            document.body.classList.remove('exportando');
        }

        // Imprimir
        function imprimir() {
            window.print();
        }

        const btnImg = document.getElementById('download-image');
        if (btnImg) btnImg.addEventListener('click', baixarImagem);
        const btnPdf = document.getElementById('download-pdf');
        if (btnPdf) btnPdf.addEventListener('click', baixarPDF);
        const btnPrint = document.getElementById('print-page');
        if (btnPrint) btnPrint.addEventListener('click', imprimir);

        // nada a fazer além do font-size base
    });

    // Expor funções globalmente se necessário
    window.toggleFormula = toggleFormula;
    window.calcularTotal = calcularTotal;
    window.finalizarCompra = finalizarCompra;
})();
