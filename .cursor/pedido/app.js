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
    
    // Configuração da API de Checkout Transparente
    const CHECKOUT_API_URL = ENV_CONFIG.VITE_CHECKOUT_API_URL || CONFIG_FALLBACK.CHECKOUT_API_URL || 'http://localhost:3001';
    const CHECKOUT_API_KEY = ENV_CONFIG.VITE_CHECKOUT_API_KEY || CONFIG_FALLBACK.CHECKOUT_API_KEY || '';

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
    let etapaAtual = 1;
    let dadosCliente = {};
    let dadosPagamento = {};

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
            // Otimização: selecionar apenas campos necessários e usar cache do navegador
            const cacheKey = `precheckout_${linkId}`;
            const cachedData = sessionStorage.getItem(cacheKey);
            
            let data, error;
            
            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    const cacheTime = parsed.cached_at || 0;
                    const now = Date.now();
                    // Cache válido por 5 minutos
                    if (now - cacheTime < 5 * 60 * 1000) {
                        data = parsed.data;
                        error = null;
                    } else {
                        sessionStorage.removeItem(cacheKey);
                    }
                } catch (e) {
                    sessionStorage.removeItem(cacheKey);
                }
            }
            
            if (!data) {
                const result = await supabase
                    .schema(SUPABASE_SCHEMA)
                    .from('pre_checkout')
                    .select('id, link_pre_checkout, codigo_orcamento, nome_cliente, dados_orcamento, formulas_selecionadas, status, expires_at, created_at')
                    .eq('link_pre_checkout', linkId)
                    .single();
                
                data = result.data;
                error = result.error;
                
                // Salvar no cache
                if (data && !error) {
                    sessionStorage.setItem(cacheKey, JSON.stringify({
                        data: data,
                        cached_at: Date.now()
                    }));
                }
            }

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
            
            // Garantir que a etapa 1 está visível
            mostrarEtapa(1);
            
            // Garantir que o botão próximo está habilitado se houver fórmulas selecionadas
            setTimeout(() => {
                const btnProximoPedido = document.getElementById('btn-proximo-pedido');
                if (btnProximoPedido && formulasSelecionadas.size > 0) {
                    btnProximoPedido.disabled = false;
                }
            }, 100);

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
        
        // Atualizar botão próximo após toggle
        const btnProximoPedido = document.getElementById('btn-proximo-pedido');
        if (btnProximoPedido) {
            const temFormulas = formulasSelecionadas.size > 0;
            btnProximoPedido.disabled = !temFormulas;
        }
        
        // Rastrear seleção/deseleção
        if (typeof window.trackEvent === 'function' && formula) {
            const eventName = wasSelected ? 'formula_deselect' : 'formula_select';
            window.trackEvent(eventName, {
                formula_numero: numero,
                formula_valor: normalizarValor(formula.valor || 0),
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

    // Função para normalizar valores (converte centavos para reais se necessário)
    function normalizarValor(valor) {
        if (!valor || valor === 0) return 0;
        const num = Number(valor);
        // Se o valor for muito grande (provavelmente está em centavos), divide por 100
        // Ex: 11671 -> 116.71, mas 116.71 permanece 116.71
        if (num > 1000 && num % 100 === 0) {
            // Se for múltiplo de 100 e maior que 1000, provavelmente está em centavos
            return num / 100;
        }
        // Se o valor parece estar em centavos (ex: 11671 para 116.71)
        // Verifica se dividindo por 100 resulta em um valor razoável (< 10000)
        if (num > 100 && num < 1000000) {
            const valorReais = num / 100;
            // Se o valor em reais for razoável (entre 1 e 10000), assume que estava em centavos
            if (valorReais >= 1 && valorReais <= 10000) {
                return valorReais;
            }
        }
        return num;
    }

    function calcularSubtotal() {
        if (!orcamentoData || !orcamentoData.dados_orcamento) return 0;
        
        return orcamentoData.dados_orcamento.formulas
            .filter(f => formulasSelecionadas.has(f.numero))
            .reduce((sum, f) => sum + normalizarValor(f.valor || 0), 0);
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
        
        // Habilitar/desabilitar botão de próximo
        const btnProximoPedido = document.getElementById('btn-proximo-pedido');
        if (btnProximoPedido) {
            const temFormulas = formulasSelecionadas.size > 0;
            btnProximoPedido.disabled = !temFormulas;
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

    // Funções de formatação de campos
    function formatarCPF(value) {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return value;
    }

    function formatarTelefone(value) {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        return value;
    }

    function formatarCEP(value) {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 8) {
            return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
        }
        return value;
    }

    async function buscarEnderecoPorCEP(cep) {
        const cepInput = document.getElementById('cep');
        const enderecoInput = document.getElementById('endereco');
        const bairroInput = document.getElementById('bairro');
        const cidadeInput = document.getElementById('cidade');
        const estadoInput = document.getElementById('estado');
        const btnBuscarCep = document.getElementById('btn-buscar-cep');
        
        if (!cepInput || !enderecoInput || !bairroInput || !cidadeInput || !estadoInput) {
            return;
        }

        // Remover classes de erro anteriores
        cepInput.classList.remove('cep-error', 'cep-loading', 'cep-success', 'error');
        
        // Remover mensagens de erro anteriores
        const existingError = cepInput.parentElement.querySelector('.cep-error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Adicionar classe de loading
        cepInput.classList.add('cep-loading');
        cepInput.disabled = true;
        if (btnBuscarCep) {
            btnBuscarCep.disabled = true;
        }

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                throw new Error('CEP não encontrado');
            }

            // Preencher campos automaticamente
            enderecoInput.value = data.logradouro || '';
            bairroInput.value = data.bairro || '';
            cidadeInput.value = data.localidade || '';
            estadoInput.value = data.uf || '';

            // Adicionar classe de sucesso
            cepInput.classList.remove('cep-loading');
            cepInput.classList.add('cep-success');
            
            // Remover classe de sucesso após 2 segundos
            setTimeout(() => {
                cepInput.classList.remove('cep-success');
            }, 2000);

            // Rastrear busca de CEP bem-sucedida
            if (typeof window.trackEvent === 'function') {
                window.trackEvent('cep_busca_success', {
                    cep: cep,
                    cidade: data.localidade,
                    estado: data.uf
                });
            }

        } catch (err) {
            console.error('Erro ao buscar CEP:', err);
            
            // Adicionar classe de erro
            cepInput.classList.remove('cep-loading');
            cepInput.classList.add('cep-error');
            
            // Mostrar mensagem de erro
            const errorMsg = 'CEP não encontrado. Verifique e tente novamente.';
            // Remover mensagens anteriores
            const existingError = cepInput.parentElement.querySelector('.cep-error-message');
            if (existingError) {
                existingError.remove();
            }
            
            const errorEl = document.createElement('span');
            errorEl.className = 'cep-error-message';
            errorEl.textContent = errorMsg;
            cepInput.parentElement.appendChild(errorEl);
            
            // Remover mensagem após 5 segundos
            setTimeout(() => {
                if (errorEl.parentElement) {
                    errorEl.remove();
                }
            }, 5000);
            
            // Rastrear erro na busca de CEP
            if (typeof window.trackEvent === 'function') {
                window.trackEvent('cep_busca_error', {
                    cep: cep,
                    error: err.message
                });
            }
        } finally {
            cepInput.disabled = false;
            if (btnBuscarCep) {
                btnBuscarCep.disabled = false;
            }
        }
    }

    function formatarCartao(value) {
        const numbers = value.replace(/\D/g, '');
        return numbers.replace(/(\d{4})(?=\d)/g, '$1 ');
    }

    function formatarValidade(value) {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 4) {
            return numbers.replace(/(\d{2})(\d{2})/, '$1/$2');
        }
        return value;
    }

    // Gerenciamento de etapas
    function atualizarIndicadorProgresso(etapa) {
        // Atualizar ícones e linhas
        for (let i = 1; i <= 3; i++) {
            const stepEl = document.querySelector(`#step-indicator-${i}`);
            const stepIcon = stepEl?.querySelector('.step-icon');
            const stepLine = document.querySelector(`#progress-line-${i}`);
            const stepTitle = stepEl?.querySelector('.step-title');
            
            if (!stepIcon) continue;
            
            // Remover todas as classes de estado
            stepIcon.classList.remove('step-completed', 'step-active', 'step-pending');
            if (stepLine) stepLine.classList.remove('completed');
            if (stepEl) stepEl.classList.remove('step-active', 'step-completed', 'step-pending');
            
            if (i < etapa) {
                // Etapa já completada
                stepIcon.classList.add('step-completed');
                stepEl?.classList.add('step-completed');
                if (stepLine) {
                    stepLine.classList.add('completed');
                }
                if (stepTitle) {
                    stepTitle.style.color = 'var(--brand-text)';
                    stepTitle.style.fontWeight = '700';
                }
            } else if (i === etapa) {
                // Etapa atual (ativa)
                stepIcon.classList.add('step-active');
                stepEl?.classList.add('step-active');
                if (stepLine) {
                    stepLine.classList.remove('completed');
                }
                if (stepTitle) {
                    stepTitle.style.color = 'var(--brand-text)';
                    stepTitle.style.fontWeight = '700';
                }
                
                // Scroll para etapa ativa no mobile
                if (window.innerWidth <= 768 && stepEl) {
                    setTimeout(() => {
                        stepEl.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'nearest',
                            inline: 'center'
                        });
                    }, 100);
                }
            } else {
                // Etapa pendente
                stepIcon.classList.add('step-pending');
                stepEl?.classList.add('step-pending');
                if (stepLine) {
                    stepLine.classList.remove('completed');
                }
                if (stepTitle) {
                    stepTitle.style.color = 'var(--muted-color)';
                    stepTitle.style.fontWeight = '600';
                }
            }
        }
    }

    function mostrarEtapa(etapa) {
        // Esconder todas as etapas
        document.querySelectorAll('.step-container').forEach(el => {
            el.style.display = 'none';
        });
        
        // Mostrar etapa atual
        const etapaEl = document.getElementById(`step-${etapa}`);
        if (etapaEl) {
            etapaEl.style.display = 'block';
        }
        
        etapaAtual = etapa;
        atualizarIndicadorProgresso(etapa);
        
        // Se for etapa 3 (pagamento), atualizar opções de parcelas
        if (etapa === 3) {
            atualizarOpcoesParcelas();
        }
        
        // Scroll para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Atualiza as opções de parcelas baseado no valor total
     */
    function atualizarOpcoesParcelas() {
        const selectParcelas = document.getElementById('card-installments');
        if (!selectParcelas) return;

        const subtotal = calcularSubtotal();
        const frete = calcularFrete(subtotal);
        const valorTotal = subtotal + frete;
        const maxParcelas = getMaxInstallments(valorTotal);

        // Limpar opções existentes
        selectParcelas.innerHTML = '';

        // Adicionar opções baseadas no máximo permitido
        for (let i = 1; i <= maxParcelas; i++) {
            const option = document.createElement('option');
            const valorParcela = valorTotal / i;
            option.value = i;
            
            if (i === 1) {
                option.textContent = `À vista - ${formatarValor(valorParcela)}`;
            } else {
                option.textContent = `${i}x de ${formatarValor(valorParcela)}`;
            }
            
            selectParcelas.appendChild(option);
        }
    }

    async function salvarEtapa1() {
        const linkId = obterLinkIdDaUrl();
        if (!linkId) return;

        try {
            const { error } = await supabase
                .schema(SUPABASE_SCHEMA)
                .from('pre_checkout')
                .update({
                    formulas_selecionadas: Array.from(formulasSelecionadas),
                    status: 'pendente',
                    updated_at: new Date().toISOString()
                })
                .eq('link_pre_checkout', linkId);

            if (error) throw error;
        } catch (err) {
            console.error('Erro ao salvar etapa 1:', err);
        }
    }

    async function salvarEtapa2() {
        const linkId = obterLinkIdDaUrl();
        if (!linkId) return;

        try {
            const { error } = await supabase
                .schema(SUPABASE_SCHEMA)
                .from('pre_checkout')
                .update({
                    dados_cliente: dadosCliente,
                    updated_at: new Date().toISOString()
                })
                .eq('link_pre_checkout', linkId);

            if (error) throw error;
        } catch (err) {
            console.error('Erro ao salvar etapa 2:', err);
        }
    }

    async function salvarEtapa3() {
        const linkId = obterLinkIdDaUrl();
        if (!linkId) return;

        try {
            const { error } = await supabase
                .schema(SUPABASE_SCHEMA)
                .from('pre_checkout')
                .update({
                    dados_pagamento: dadosPagamento,
                    status: 'aguardando_pagamento',
                    updated_at: new Date().toISOString()
                })
                .eq('link_pre_checkout', linkId);

            if (error) throw error;
        } catch (err) {
            console.error('Erro ao salvar etapa 3:', err);
        }
    }

    function validarEtapa1() {
        if (formulasSelecionadas.size === 0) {
            alert('Selecione pelo menos uma fórmula para continuar');
            return false;
        }
        return true;
    }

    function validarEtapa2() {
        const form = document.getElementById('form-dados');
        let isValid = true;
        
        // Remover erros anteriores
        form.querySelectorAll('.error').forEach(el => {
            el.classList.remove('error');
        });
        form.querySelectorAll('.form-error-message').forEach(el => {
            el.remove();
        });
        
        // Validar cada campo
        const nome = document.getElementById('nome');
        if (!nome.value.trim()) {
            mostrarErroCampo(nome, 'Nome completo é obrigatório');
            isValid = false;
        }
        
        const cpf = document.getElementById('cpf');
        const cpfLimpo = cpf.value.replace(/\D/g, '');
        if (cpfLimpo.length !== 11) {
            mostrarErroCampo(cpf, 'CPF deve ter 11 dígitos');
            isValid = false;
        }
        
        const email = document.getElementById('email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
            mostrarErroCampo(email, 'Email inválido');
            isValid = false;
        }
        
        const celular = document.getElementById('celular');
        const celularLimpo = celular.value.replace(/\D/g, '');
        if (celularLimpo.length < 10 || celularLimpo.length > 11) {
            mostrarErroCampo(celular, 'Celular deve ter 10 ou 11 dígitos');
            isValid = false;
        }
        
        const dataNascimento = document.getElementById('data-nascimento');
        if (!dataNascimento.value) {
            mostrarErroCampo(dataNascimento, 'Data de nascimento é obrigatória');
            isValid = false;
        }
        
        const sexo = document.getElementById('sexo');
        if (!sexo.value) {
            mostrarErroCampo(sexo, 'Selecione o sexo');
            isValid = false;
        }
        
        const cep = document.getElementById('cep');
        const cepLimpo = cep.value.replace(/\D/g, '');
        if (cepLimpo.length !== 8) {
            mostrarErroCampo(cep, 'CEP deve ter 8 dígitos');
            isValid = false;
        }
        
        const endereco = document.getElementById('endereco');
        if (!endereco.value.trim()) {
            mostrarErroCampo(endereco, 'Endereço é obrigatório');
            isValid = false;
        }
        
        const bairro = document.getElementById('bairro');
        if (!bairro.value.trim()) {
            mostrarErroCampo(bairro, 'Bairro é obrigatório');
            isValid = false;
        }
        
        const cidade = document.getElementById('cidade');
        if (!cidade.value.trim()) {
            mostrarErroCampo(cidade, 'Cidade é obrigatória');
            isValid = false;
        }
        
        const estado = document.getElementById('estado');
        if (estado.value.length !== 2) {
            mostrarErroCampo(estado, 'Estado deve ter 2 letras (UF)');
            isValid = false;
        }
        
        if (!isValid) {
            // Scroll para o primeiro erro
            const firstError = form.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
            return false;
        }
        
        // Coletar dados do formulário
        dadosCliente = {
            nome: nome.value.trim(),
            cpf: cpfLimpo,
            email: email.value.trim(),
            celular: celularLimpo,
            data_nascimento: dataNascimento.value,
            sexo: sexo.value,
            cep: cepLimpo,
            endereco: endereco.value.trim(),
            numero: document.getElementById('numero').value.trim(),
            complemento: document.getElementById('complemento').value.trim(),
            bairro: bairro.value.trim(),
            cidade: cidade.value.trim(),
            estado: estado.value.toUpperCase()
        };
        
        return true;
    }
    
    function mostrarErroCampo(campo, mensagem) {
        campo.classList.add('error');
        const errorEl = document.createElement('span');
        errorEl.className = 'form-error-message';
        errorEl.textContent = mensagem;
        campo.parentElement.appendChild(errorEl);
    }

    function validarEtapa3() {
        const metodo = dadosPagamento.metodo;
        
        if (metodo === 'pix') {
            // PIX não precisa validação adicional
            return true;
        } else if (metodo === 'cartao') {
            const cardNumber = document.getElementById('card-number');
            const cardName = document.getElementById('card-name');
            const cardExpiry = document.getElementById('card-expiry');
            const cardCvv = document.getElementById('card-cvv');
            const cardInstallments = document.getElementById('card-installments');
            
            if (!cardNumber || !cardNumber.value || cardNumber.value.replace(/\D/g, '').length < 13) {
                alert('Número do cartão inválido');
                if (cardNumber) cardNumber.focus();
                return false;
            }
            if (!cardName || !cardName.value.trim()) {
                alert('Nome no cartão é obrigatório');
                if (cardName) cardName.focus();
                return false;
            }
            if (!cardExpiry || !cardExpiry.value || cardExpiry.value.length !== 5) {
                alert('Validade inválida (formato: MM/AA)');
                if (cardExpiry) cardExpiry.focus();
                return false;
            }
            if (!cardCvv || !cardCvv.value || cardCvv.value.length < 3) {
                alert('CVV inválido');
                if (cardCvv) cardCvv.focus();
                return false;
            }
            
            // Coletar dados do cartão
            dadosPagamento.dados_cartao = {
                numero: cardNumber.value.replace(/\D/g, ''),
                nome: cardName.value.trim(),
                validade: cardExpiry.value,
                cvv: cardCvv.value,
                parcelas: cardInstallments ? cardInstallments.value : '1'
            };
            
            return true;
        }
        
        alert('Selecione um método de pagamento');
        return false;
    }

    async function avancarEtapa() {
        if (etapaAtual === 1) {
            if (!validarEtapa1()) return;
            await salvarEtapa1();
            mostrarEtapa(2);
        } else if (etapaAtual === 2) {
            if (!validarEtapa2()) return;
            await salvarEtapa2();
            mostrarEtapa(3);
        }
    }

    function voltarEtapa() {
        if (etapaAtual === 2) {
            mostrarEtapa(1);
        } else if (etapaAtual === 3) {
            mostrarEtapa(2);
        }
    }

    // ============================================
    // FUNÇÕES DE INTEGRAÇÃO COM API DE CHECKOUT
    // ============================================

    /**
     * Cria um cliente no Asaas via API
     */
    async function criarClienteAsaas(dadosCliente) {
        if (!CHECKOUT_API_KEY) {
            throw new Error('API Key do checkout não configurada. Configure CHECKOUT_API_KEY no config.js');
        }

        const response = await fetch(`${CHECKOUT_API_URL}/api/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': CHECKOUT_API_KEY
            },
            body: JSON.stringify({
                name: dadosCliente.nome,
                cpfCnpj: dadosCliente.cpf,
                email: dadosCliente.email,
                mobilePhone: dadosCliente.celular,
                address: dadosCliente.endereco,
                addressNumber: dadosCliente.numero || '',
                complement: dadosCliente.complemento || '',
                province: dadosCliente.bairro,
                postalCode: dadosCliente.cep,
                city: dadosCliente.cidade,
                // Campos opcionais
                ...(dadosCliente.data_nascimento && { 
                    // Se necessário, adicionar campo de data de nascimento
                })
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Erro ao criar cliente: ${response.status}`);
        }

        const data = await response.json();
        return data.customer;
    }

    /**
     * Cria um pagamento via PIX
     */
    async function criarPagamentoPix(customerId, valor, descricao) {
        if (!CHECKOUT_API_KEY) {
            throw new Error('API Key do checkout não configurada');
        }

        const payload = {
            customerId: customerId,
            billingType: 'PIX',
            value: valor,
            description: descricao || 'Pagamento OficialMed'
        };

        console.log('📤 Enviando requisição para criar pagamento PIX:');
        console.log('URL:', `${CHECKOUT_API_URL}/api/payment`);
        console.log('Payload:', payload);

        const response = await fetch(`${CHECKOUT_API_URL}/api/payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': CHECKOUT_API_KEY
            },
            body: JSON.stringify(payload)
        });

        console.log('📥 Resposta recebida:', response.status, response.statusText);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Erro na resposta:', errorData);
            throw new Error(errorData.error || `Erro ao criar pagamento PIX: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Dados do pagamento recebidos:', data);
        return data.payment;
    }

    /**
     * Cria um pagamento via Cartão de Crédito
     */
    async function criarPagamentoCartao(customerId, valor, dadosCartao, dadosCliente, parcelas, descricao) {
        if (!CHECKOUT_API_KEY) {
            throw new Error('API Key do checkout não configurada');
        }

        // Separar mês e ano da validade (formato MM/AA)
        const [expiryMonth, expiryYear] = dadosCartao.validade.split('/');
        const expiryYearFull = `20${expiryYear}`; // Converter AA para AAAA

        const paymentData = {
            customerId: customerId,
            billingType: 'CREDIT_CARD',
            value: valor,
            description: descricao || 'Pagamento OficialMed',
            creditCard: {
                holderName: dadosCartao.nome.toUpperCase(),
                number: dadosCartao.numero.replace(/\D/g, ''),
                expiryMonth: expiryMonth,
                expiryYear: expiryYearFull,
                ccv: dadosCartao.cvv
            },
            creditCardHolderInfo: {
                name: dadosCliente.nome,
                email: dadosCliente.email,
                cpfCnpj: dadosCliente.cpf.replace(/\D/g, ''),
                postalCode: dadosCliente.cep.replace(/\D/g, ''),
                addressNumber: dadosCliente.numero || '',
                phone: dadosCliente.celular.replace(/\D/g, '')
            },
            remoteIp: await obterIPCliente() || '127.0.0.1'
        };

        // Adicionar parcelas se for maior que 1
        const parcelasNum = parseInt(parcelas) || 1;
        if (parcelasNum > 1) {
            paymentData.installmentCount = parcelasNum;
        }

        const response = await fetch(`${CHECKOUT_API_URL}/api/payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': CHECKOUT_API_KEY
            },
            body: JSON.stringify(paymentData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Erro ao criar pagamento: ${response.status}`);
        }

        const data = await response.json();
        return data.payment;
    }

    /**
     * Busca o QR Code de um pagamento PIX
     */
    async function buscarQrCodePix(paymentId) {
        if (!CHECKOUT_API_KEY) {
            throw new Error('API Key do checkout não configurada');
        }

        const url = `${CHECKOUT_API_URL}/api/payment/${paymentId}/pix-qrcode`;
        console.log('📤 Buscando QR Code PIX na URL:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-API-Key': CHECKOUT_API_KEY
            }
        });

        console.log('📥 Resposta do QR Code:', response.status, response.statusText);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Erro ao buscar QR Code:', errorData);
            throw new Error(errorData.error || `Erro ao buscar QR Code: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ QR Code recebido:', data);
        return data.pixQrCode;
    }

    /**
     * Obtém o IP do cliente (tenta via backend ou usa fallback)
     */
    async function obterIPCliente() {
        try {
            // Tentar obter IP via serviço externo
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (err) {
            console.warn('Não foi possível obter IP do cliente:', err);
            return null;
        }
    }

    /**
     * Calcula o número máximo de parcelas baseado no valor
     */
    function getMaxInstallments(value) {
        if (value <= 100) return 1;      // Até R$ 100: à vista (1x)
        if (value <= 250) return 2;       // R$ 101 a 250: até 2x
        if (value <= 600) return 4;       // R$ 251 a 600: até 4x
        if (value <= 1000) return 6;     // R$ 601 a 1000: até 6x
        return 8;                        // Acima de R$ 1000: até 8x
    }

    async function finalizarCompra() {
        if (!validarEtapa3()) return;

        const btnFinalizar = document.getElementById('btn-finalizar-pagamento');
        
        try {
            if (btnFinalizar) {
                btnFinalizar.disabled = true;
                btnFinalizar.textContent = 'Processando...';
            }

            const linkId = obterLinkIdDaUrl();
            if (!linkId) {
                throw new Error('Link ID não encontrado');
            }

            // Salvar dados de pagamento
            await salvarEtapa3();

            // Calcular valores (usando o valor total calculado)
            const subtotal = calcularSubtotal();
            const frete = calcularFrete(subtotal);
            const valorTotal = subtotal + frete;

            // Rastrear finalização
            if (typeof window.trackEvent === 'function') {
                window.trackEvent('finalizar_compra_click', {
                    subtotal: subtotal,
                    frete: frete,
                    total: valorTotal,
                    metodo_pagamento: dadosPagamento.metodo,
                    quantidade_produtos: formulasSelecionadas.size
                });
            }

            // Verificar se API está configurada
            console.log('🔍 Verificando configuração da API...');
            console.log('CHECKOUT_API_URL:', CHECKOUT_API_URL);
            console.log('CHECKOUT_API_KEY configurada:', CHECKOUT_API_KEY ? 'Sim' : 'Não');
            
            if (!CHECKOUT_API_KEY || CHECKOUT_API_KEY === 'sua_chave_api_backend') {
                const errorMsg = 'API Key do checkout não configurada. Configure CHECKOUT_API_KEY no config.js ou variáveis de ambiente.';
                console.error('❌', errorMsg);
                alert(errorMsg + '\n\nVerifique o console para mais detalhes.');
                throw new Error(errorMsg);
            }

            // 1. Criar cliente no Asaas
            console.log('📝 Criando cliente no Asaas...');
            console.log('Dados do cliente:', dadosCliente);
            console.log('URL da API:', `${CHECKOUT_API_URL}/api/customers`);
            
            const customer = await criarClienteAsaas(dadosCliente);
            console.log('✅ Cliente criado:', customer.id);

            let payment = null;
            let qrCodeData = null;

            // 2. Criar pagamento baseado no método escolhido
            console.log('💳 Método de pagamento selecionado:', dadosPagamento.metodo);
            console.log('💰 Valor total:', valorTotal);
            
            if (dadosPagamento.metodo === 'pix') {
                console.log('💳 Criando pagamento PIX...');
                console.log('Customer ID:', customer.id);
                console.log('Valor:', valorTotal);
                
                payment = await criarPagamentoPix(
                    customer.id,
                    valorTotal,
                    `Orçamento ${orcamentoData?.dados_orcamento?.codigo || 'N/A'} - OficialMed`
                );
                console.log('✅ Pagamento PIX criado:', payment);
                console.log('Payment ID:', payment.id);
                console.log('Payment Status:', payment.status);

                // 3. Buscar QR Code PIX
                console.log('📱 Buscando QR Code PIX...');
                console.log('Payment ID para buscar QR Code:', payment.id);
                
                qrCodeData = await buscarQrCodePix(payment.id);
                console.log('✅ QR Code obtido:', qrCodeData);

                // Exibir QR Code na tela
                console.log('🖼️ Exibindo QR Code na tela...');
                exibirQrCodePix(qrCodeData);

                // Rastrear sucesso PIX
                if (typeof window.trackEvent === 'function') {
                    window.trackEvent('pagamento_pix_criado', {
                        payment_id: payment.id,
                        valor: valorTotal,
                        customer_id: customer.id
                    });
                }

            } else if (dadosPagamento.metodo === 'cartao') {
                console.log('💳 Criando pagamento com cartão...');
                const parcelas = dadosPagamento.dados_cartao?.parcelas || '1';
                
                payment = await criarPagamentoCartao(
                    customer.id,
                    valorTotal,
                    dadosPagamento.dados_cartao,
                    dadosCliente,
                    parcelas,
                    `Orçamento ${orcamentoData?.dados_orcamento?.codigo || 'N/A'} - OficialMed`
                );
                console.log('✅ Pagamento criado:', payment.id);

                // Verificar status do pagamento
                if (payment.status === 'CONFIRMED') {
                    // Pagamento aprovado
                    mostrarMensagemSucesso('Pagamento aprovado com sucesso!', payment);
                    
                    // Rastrear sucesso
                    if (typeof window.trackEvent === 'function') {
                        window.trackEvent('pagamento_cartao_aprovado', {
                            payment_id: payment.id,
                            valor: valorTotal,
                            parcelas: parcelas,
                            customer_id: customer.id
                        });
                    }
                } else if (payment.status === 'PENDING') {
                    // Pagamento pendente (aguardando confirmação)
                    mostrarMensagemAguardando('Pagamento em processamento. Aguarde a confirmação.', payment);
                    
                    // Rastrear pendente
                    if (typeof window.trackEvent === 'function') {
                        window.trackEvent('pagamento_cartao_pendente', {
                            payment_id: payment.id,
                            valor: valorTotal,
                            parcelas: parcelas,
                            customer_id: customer.id
                        });
                    }
                } else {
                    throw new Error(`Status de pagamento inesperado: ${payment.status}`);
                }
            }

            // Atualizar status no Supabase
            await supabase
                .schema(SUPABASE_SCHEMA)
                .from('pre_checkout')
                .update({
                    status: payment?.status === 'CONFIRMED' ? 'pago' : 'aguardando_pagamento',
                    payment_id: payment?.id || null,
                    customer_id: customer.id,
                    updated_at: new Date().toISOString()
                })
                .eq('link_pre_checkout', linkId);

        } catch (err) {
            console.error('❌ Erro ao finalizar:', err);
            
            // Rastrear erro
            if (typeof window.trackEvent === 'function') {
                window.trackEvent('pagamento_erro', {
                    error_message: err.message,
                    metodo_pagamento: dadosPagamento.metodo
                });
            }

            alert(`Erro ao processar pagamento: ${err.message}`);
            
            if (btnFinalizar) {
                btnFinalizar.disabled = false;
                btnFinalizar.textContent = 'Finalizar Compra';
            }
        }
    }

    /**
     * Exibe o QR Code PIX na tela
     */
    function exibirQrCodePix(qrCodeData) {
        console.log('🖼️ Exibindo QR Code PIX na tela...');
        console.log('Dados do QR Code:', qrCodeData);
        
        const pixForm = document.getElementById('form-pix');
        const pixQrCodeContainer = document.querySelector('.pix-qrcode');
        const pixCodeTextarea = document.getElementById('pix-code');

        if (!pixForm) {
            console.error('❌ Formulário PIX não encontrado!');
            return;
        }

        if (!pixQrCodeContainer) {
            console.error('❌ Container do QR Code não encontrado!');
            return;
        }

        // Mostrar formulário PIX primeiro
        pixForm.style.display = 'block';

        if (qrCodeData && qrCodeData.encodedImage) {
            console.log('✅ Criando imagem do QR Code...');
            // Criar imagem do QR Code
            const img = document.createElement('img');
            img.src = `data:image/png;base64,${qrCodeData.encodedImage}`;
            img.alt = 'QR Code PIX';
            
            // Limpar placeholder e adicionar imagem
            const placeholder = document.getElementById('pix-qr-code-placeholder');
            if (placeholder) {
                placeholder.remove();
            }
            pixQrCodeContainer.innerHTML = '';
            pixQrCodeContainer.appendChild(img);
            console.log('✅ Imagem do QR Code adicionada');
        } else {
            console.warn('⚠️ QR Code não possui imagem encodedImage');
        }

        if (pixCodeTextarea && qrCodeData && qrCodeData.payload) {
            pixCodeTextarea.value = qrCodeData.payload;
            console.log('✅ Código PIX copiado para o campo');
        } else {
            console.warn('⚠️ QR Code não possui payload');
        }

        console.log('✅ Formulário PIX exibido');

        // Scroll para o QR Code
        setTimeout(() => {
            pixForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }

    /**
     * Mostra mensagem de sucesso
     */
    function mostrarMensagemSucesso(mensagem, payment) {
        // Criar modal de sucesso
        const modal = document.createElement('div');
        modal.className = 'payment-success-modal';
        modal.innerHTML = `
            <div class="payment-success-content">
                <div class="success-icon">✅</div>
                <h2>${mensagem}</h2>
                <p>Seu pagamento foi processado com sucesso. Obrigado pela sua compra!</p>
                <div class="payment-info">
                    <p><strong>ID do Pagamento:</strong> ${payment.id}</p>
                    <p><strong>Status:</strong> ${payment.status}</p>
                    <p><strong>Valor:</strong> ${formatarValor(payment.value)}</p>
                    ${payment.installmentCount > 1 ? `<p><strong>Parcelas:</strong> ${payment.installmentCount}x</p>` : ''}
                </div>
                <button class="btn-close-modal" onclick="this.closest('.payment-success-modal').remove()">Fechar</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * Mostra mensagem de aguardando
     */
    function mostrarMensagemAguardando(mensagem, payment) {
        const modal = document.createElement('div');
        modal.className = 'payment-pending-modal';
        modal.innerHTML = `
            <div class="payment-pending-content">
                <div class="pending-icon">⏳</div>
                <h2>${mensagem}</h2>
                <p>Você receberá uma confirmação por email assim que o pagamento for processado.</p>
                <div class="payment-info">
                    <p><strong>ID do Pagamento:</strong> ${payment.id}</p>
                    <p><strong>Status:</strong> ${payment.status}</p>
                    <p><strong>Valor:</strong> ${formatarValor(payment.value)}</p>
                    ${payment.installmentCount > 1 ? `<p><strong>Parcelas:</strong> ${payment.installmentCount}x</p>` : ''}
                </div>
                <button class="btn-close-modal" onclick="this.closest('.payment-pending-modal').remove()">Fechar</button>
            </div>
        `;
        document.body.appendChild(modal);
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

            const valorNormalizado = normalizarValor(formula.valor || 0);
            formulaEl.innerHTML = `
                <div class="formula-checkbox">
                    <div class="checkbox-custom ${isSelecionada ? 'checked' : ''}"></div>
                </div>
                <div class="formula-content">
                    <div class="formula-header">
                        <span class="formula-numero">Fórmula nº ${formula.numero}</span>
                        <span class="formula-valor">${formatarValor(valorNormalizado)}</span>
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
        
        // Atualizar botão próximo
        const btnProximoPedido = document.getElementById('btn-proximo-pedido');
        if (btnProximoPedido) {
            const temFormulas = formulasSelecionadas.size > 0;
            btnProximoPedido.disabled = !temFormulas;
        }
    }

    // Atualizar versão no rodapé
    function atualizarVersao() {
        const versionTextEl = document.getElementById('version-text');
        if (versionTextEl && window.VERSION) {
            versionTextEl.textContent = window.VERSION.getFullVersion();
        }
    }

    // Inicializar quando a página carregar
    document.addEventListener('DOMContentLoaded', () => {
        atualizarVersao();
        carregarPreCheckout();
        
        // Event listeners para navegação entre etapas
        const btnProximoPedido = document.getElementById('btn-proximo-pedido');
        if (btnProximoPedido) {
            btnProximoPedido.addEventListener('click', avancarEtapa);
        }
        
        const btnProximoDados = document.getElementById('btn-proximo-dados');
        if (btnProximoDados) {
            btnProximoDados.addEventListener('click', avancarEtapa);
        }
        
        const btnVoltarDados = document.getElementById('btn-voltar-dados');
        if (btnVoltarDados) {
            btnVoltarDados.addEventListener('click', voltarEtapa);
        }
        
        const btnVoltarPagamento = document.getElementById('btn-voltar-pagamento');
        if (btnVoltarPagamento) {
            btnVoltarPagamento.addEventListener('click', voltarEtapa);
        }
        
        const btnFinalizarPagamento = document.getElementById('btn-finalizar-pagamento');
        if (btnFinalizarPagamento) {
            btnFinalizarPagamento.addEventListener('click', finalizarCompra);
        }
        
        // Formatação de campos
        const cpfInput = document.getElementById('cpf');
        if (cpfInput) {
            cpfInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                // Limitar a 11 dígitos
                if (value.length > 11) {
                    value = value.substring(0, 11);
                }
                e.target.value = formatarCPF(value);
                // Remover erro ao digitar
                e.target.classList.remove('error');
            });
        }
        
        const celularInput = document.getElementById('celular');
        if (celularInput) {
            celularInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                // Limitar a 11 dígitos
                if (value.length > 11) {
                    value = value.substring(0, 11);
                }
                e.target.value = formatarTelefone(value);
                e.target.classList.remove('error');
            });
        }
        
        // Validação de email
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('input', (e) => {
                e.target.classList.remove('error');
            });
        }
        
        // Validação de nome (apenas letras e espaços)
        const nomeInput = document.getElementById('nome');
        if (nomeInput) {
            nomeInput.addEventListener('input', (e) => {
                // Permitir apenas letras, espaços e acentos
                e.target.value = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
                e.target.classList.remove('error');
            });
        }
        
        // Validação de número (apenas números)
        const numeroInput = document.getElementById('numero');
        if (numeroInput) {
            numeroInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
            });
        }
        
        // Validação de estado (apenas letras, maiúsculas)
        const estadoInput = document.getElementById('estado');
        if (estadoInput) {
            estadoInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
                e.target.classList.remove('error');
            });
        }
        
        // Validação de cidade, bairro, endereço (letras, números e alguns caracteres)
        const enderecoInput = document.getElementById('endereco');
        const bairroInput = document.getElementById('bairro');
        const cidadeInput = document.getElementById('cidade');
        
        [enderecoInput, bairroInput, cidadeInput].forEach(input => {
            if (input) {
                input.addEventListener('input', (e) => {
                    // Permitir letras, números, espaços e alguns caracteres comuns
                    e.target.value = e.target.value.replace(/[^a-zA-ZÀ-ÿ0-9\s.,-]/g, '');
                    e.target.classList.remove('error');
                });
            }
        });
        
        const cepInput = document.getElementById('cep');
        const btnBuscarCep = document.getElementById('btn-buscar-cep');
        
        if (cepInput) {
            // Formatação e busca automática
            cepInput.addEventListener('input', (e) => {
                e.target.value = formatarCEP(e.target.value);
                const cepLimpo = e.target.value.replace(/\D/g, '');
                
                // Buscar automaticamente quando tiver 8 dígitos
                if (cepLimpo.length === 8) {
                    buscarEnderecoPorCEP(cepLimpo);
                } else {
                    // Remover estados quando CEP incompleto
                    cepInput.classList.remove('cep-loading', 'cep-success', 'cep-error');
                }
            });
        }
        
        // Botão buscar CEP
        if (btnBuscarCep) {
            btnBuscarCep.addEventListener('click', () => {
                const cepLimpo = cepInput.value.replace(/\D/g, '');
                if (cepLimpo.length === 8) {
                    buscarEnderecoPorCEP(cepLimpo);
                } else {
                    alert('CEP deve ter 8 dígitos');
                    cepInput.focus();
                }
            });
        }
        
        const cardNumberInput = document.getElementById('card-number');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                e.target.value = formatarCartao(e.target.value);
            });
        }
        
        const cardExpiryInput = document.getElementById('card-expiry');
        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('input', (e) => {
                e.target.value = formatarValidade(e.target.value);
            });
        }
        
        const cardCvvInput = document.getElementById('card-cvv');
        if (cardCvvInput) {
            cardCvvInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
            });
        }
        
        // Seleção de método de pagamento
        const paymentPix = document.getElementById('payment-pix');
        const paymentCartao = document.getElementById('payment-cartao');
        const formPix = document.getElementById('form-pix');
        const formCartao = document.getElementById('form-cartao');
        
        if (paymentPix) {
            paymentPix.addEventListener('click', () => {
                paymentPix.classList.add('active');
                if (paymentCartao) paymentCartao.classList.remove('active');
                if (formPix) formPix.style.display = 'block';
                if (formCartao) formCartao.style.display = 'none';
                dadosPagamento.metodo = 'pix';
            });
        }
        
        if (paymentCartao) {
            paymentCartao.addEventListener('click', () => {
                paymentCartao.classList.add('active');
                if (paymentPix) paymentPix.classList.remove('active');
                if (formPix) formPix.style.display = 'none';
                if (formCartao) formCartao.style.display = 'block';
                dadosPagamento.metodo = 'cartao';
            });
        }
        
        // Copiar código PIX (textarea)
        const pixCodeTextarea = document.getElementById('pix-code');
        if (pixCodeTextarea) {
            pixCodeTextarea.addEventListener('click', function() {
                this.select();
                document.execCommand('copy');
                const originalValue = this.value;
                this.value = 'Código copiado!';
                this.style.color = '#10b981';
                setTimeout(() => {
                    this.value = originalValue;
                    this.style.color = '';
                }, 2000);
            });
        }
        
        // Inicializar método de pagamento padrão
        if (paymentCartao && paymentPix && formCartao && formPix) {
            dadosPagamento.metodo = 'cartao';
            paymentCartao.classList.add('active');
            paymentPix.classList.remove('active');
            formCartao.style.display = 'block';
            formPix.style.display = 'none';
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
            
            // Carregar biblioteca sob demanda
            if (typeof window.loadExportLibs === 'function') {
                await window.loadExportLibs();
            }
            
            if (typeof html2canvas === 'undefined') {
                alert('Erro ao carregar biblioteca de exportação. Tente novamente.');
                return;
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
            
            // Carregar bibliotecas sob demanda
            if (typeof window.loadExportLibs === 'function') {
                await window.loadExportLibs();
            }
            
            if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
                alert('Erro ao carregar bibliotecas de exportação. Tente novamente.');
                return;
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
