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
            // Em caso de erro (ex.: link inválido/expirado), mantém mensagem de erro
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

            // Chamar webhook do n8n para gerar checkout
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    linkId: linkId,
                    formulasSelecionadas: Array.from(formulasSelecionadas)
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

            // Redirecionar para o checkout
            window.location.href = data.checkout_url;

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
            });
        }
        
        if (btnPlus) {
            btnPlus.addEventListener('click', () => {
                fontScale = Math.min(2.0, fontScale + 0.1);
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
