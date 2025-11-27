#!/usr/bin/env node

/**
 * 🔥 SINCRONIZAÇÃO DIRETA DE LEADS
 * Sincroniza o banco exatamente com o SprintHub usando métodos rápidos
 * 
 * USO: node sync-leads-direct-mcp.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração Supabase (via MCP ou env vars)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://agdffspstbxeqhqtltvb.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: 'api' }
});

// Configuração SprintHub
const SPRINTHUB_CONFIG = {
    baseUrl: 'sprinthub-api-master.sprinthub.app',
    instance: 'oficialmed',
    apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c'
};

const PAGE_LIMIT = 100;
const BATCH_SIZE = 500; // Tamanho do lote para upsert

// Cache
const sprintHubIds = new Set();
const sprintHubLeads = new Map();

// Função para buscar leads do SprintHub
async function fetchLeadsFromSprintHub(page = 0) {
    const params = new URLSearchParams({
        i: SPRINTHUB_CONFIG.instance,
        page: page.toString(),
        limit: PAGE_LIMIT.toString(),
        apitoken: SPRINTHUB_CONFIG.apiToken
    });

    const url = `https://${SPRINTHUB_CONFIG.baseUrl}/leads?${params.toString()}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
                'apitoken': SPRINTHUB_CONFIG.apiToken
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const leads = data?.data?.leads || data?.leads || data?.data || [];
        return Array.isArray(leads) ? leads : [];
    } catch (error) {
        console.error(`❌ Erro página ${page + 1}:`, error.message);
        return [];
    }
}

// Função para buscar detalhes completos
async function fetchLeadDetails(leadId) {
    const url = `https://${SPRINTHUB_CONFIG.baseUrl}/leads/${leadId}?i=${SPRINTHUB_CONFIG.instance}&allFields=1&apitoken=${SPRINTHUB_CONFIG.apiToken}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
                'apitoken': SPRINTHUB_CONFIG.apiToken
            }
        });

        if (!response.ok || response.status === 404) return null;

        const data = await response.json();
        return data?.data?.lead || data?.lead || data?.data || data;
    } catch {
        return null;
    }
}

// Função para mapear lead completo (mesma do api-sync-opportunities.js)
function mapLeadComplete(lead) {
    const getField = (field, variations = []) => {
        for (const variant of [field, ...variations]) {
            const value = lead[variant];
            if (value !== null && value !== undefined && value !== '') {
                return value;
            }
        }
        return null;
    };

    let firstname = getField('firstname', ['firstName', 'first_name']);
    let lastname = getField('lastname', ['lastName', 'last_name', 'surname', 'sobrenome']);
    
    if (!firstname && !lastname) {
        const fullname = getField('fullname', ['fullName', 'full_name', 'name', 'nome']);
        if (fullname && typeof fullname === 'string') {
            const parts = fullname.trim().split(/\s+/).filter(p => p);
            if (parts.length > 0) {
                firstname = parts[0];
                if (parts.length > 1) lastname = parts.slice(1).join(' ');
            }
        }
    }

    let whatsapp = getField('whatsapp', ['whatsApp', 'whats_app']);
    let phone = getField('phone', ['telephone', 'tel']);
    let mobile = getField('mobile', ['cellphone', 'cell']);
    
    if (!whatsapp && lead.contacts) {
        if (Array.isArray(lead.contacts)) {
            const whatsappContact = lead.contacts.find(c => c.type === 'whatsapp' || c.type === 'WhatsApp');
            whatsapp = whatsappContact?.value || whatsappContact?.phone || whatsappContact?.number || null;
        } else if (typeof lead.contacts === 'object') {
            whatsapp = lead.contacts.whatsapp || lead.contacts.whatsApp || null;
        }
    }
    
    if (!whatsapp) whatsapp = mobile || phone || null;

    const email = getField('email', ['e_mail', 'e-mail']);
    const fullname = firstname && lastname ? `${firstname} ${lastname}`.trim() : (getField('fullname', ['fullName', 'full_name', 'name', 'nome']) || null);

    const toJson = (value) => {
        if (!value) return null;
        if (typeof value === 'string') {
            try { return JSON.parse(value); } catch { return value; }
        }
        return value;
    };

    const toBigInt = (value) => {
        if (value === null || value === undefined || value === '') return null;
        try { return BigInt(value); } catch { return null; }
    };

    const toInt = (value) => {
        if (value === null || value === undefined || value === '') return 0;
        const parsed = parseInt(value);
        return isNaN(parsed) ? 0 : parsed;
    };

    const toDate = (value) => {
        if (!value) return null;
        try {
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date.toISOString();
        } catch {
            return null;
        }
    };

    const toDateOnly = (value) => {
        if (!value) return null;
        try {
            const date = new Date(value);
            if (isNaN(date.getTime())) return null;
            return date.toISOString().split('T')[0];
        } catch {
            return null;
        }
    };

    return {
        id: toBigInt(lead.id),
        firstname: firstname ? String(firstname).trim() : null,
        lastname: lastname ? String(lastname).trim() : null,
        fullname: fullname,
        email: email ? String(email).trim() : null,
        phone: phone ? String(phone).trim() : null,
        mobile: mobile ? String(mobile).trim() : null,
        whatsapp: whatsapp ? String(whatsapp).trim() : null,
        photo_url: lead.photoUrl ?? lead.photo_url ?? null,
        address: lead.address ?? null,
        city: lead.city ?? null,
        state: lead.state ?? null,
        zipcode: lead.zipcode ?? null,
        country: lead.country ?? null,
        timezone: lead.timezone ?? null,
        bairro: lead.bairro ?? null,
        complemento: lead.complemento ?? null,
        numero_entrega: lead.numero_entrega ?? lead.numero ?? null,
        rua_entrega: lead.rua_entrega ?? lead.rua ?? null,
        company: lead.company ?? null,
        points: toInt(lead.points),
        owner: toBigInt(lead.owner),
        stage: lead.stage ?? null,
        preferred_locale: lead.preferred_locale ?? null,
        user_access: toJson(lead.userAccess ?? lead.user_access),
        department_access: toJson(lead.departmentAccess ?? lead.department_access),
        ignore_sub_departments: Boolean(lead.ignoreSubDepartments ?? lead.ignore_sub_departments),
        create_date: toDate(lead.createDate ?? lead.create_date),
        updated_date: toDate(lead.updatedDate ?? lead.updated_date),
        last_active: toDate(lead.lastActive ?? lead.last_active),
        created_by: toBigInt(lead.createdBy ?? lead.created_by),
        created_by_name: lead.createdByName ?? lead.created_by_name ?? null,
        created_by_type: lead.createdByType ?? lead.created_by_type ?? null,
        updated_by: toBigInt(lead.updatedBy ?? lead.updated_by),
        updated_by_name: lead.updatedByName ?? lead.updated_by_name ?? null,
        synced_at: new Date().toISOString(),
        archived: Boolean(lead.archived),
        third_party_data: toJson(lead.thirdPartyData ?? lead.third_party_data),
        categoria: lead.categoria ?? lead.category ?? null,
        origem: lead.origem ?? lead.origin ?? null,
        observacao: lead.observacao ?? lead.observation ?? null,
        produto: lead.produto ?? lead.product ?? null,
        segmento: lead.segmento ?? lead.segment ?? null,
        data_de_nascimento: toDateOnly(lead.data_de_nascimento ?? lead.data_de_nascimento_yampi),
        data_do_contato: toDateOnly(lead.data_do_contato),
        cpf: lead.cpf ?? null,
        rg: lead.rg ?? null,
        sexo: lead.sexo ?? null,
        empresa: lead.empresa ?? null,
        capital_de_investimento: lead.capital_de_investimento ?? null,
        tipo_de_compra: lead.tipo_de_compra ?? null,
        pedidos_shopify: lead.pedidos_shopify ?? null,
        classificacao_google: lead.classificacao_google ?? null,
        grau_de_interesse: lead.grau_de_interesse ?? null,
        star_score: lead.star_score ?? null,
        avaliacao_atendente: lead.avaliacao_atendente ?? null,
        avaliacao_atendimento: lead.avaliacao_atendimento ?? null,
        qualificacao_callix: lead.qualificacao_callix ?? null,
        origem_manipulacao: lead.origem_manipulacao ?? null,
        lista_de_origem: lead.lista_de_origem ?? null,
        criativo: lead.criativo ?? null,
        plataforma: lead.plataforma ?? null,
        redes_sociais: lead.redes_sociais ?? null,
        site: lead.site ?? null,
        atendente: lead.atendente ?? null,
        atendente_atual: lead.atendente_atual ?? null,
        feedback: lead.feedback ?? null,
        observacoes_do_lead: lead.observacoes_do_lead ?? null,
        comportamento_da_ia: lead.comportamento_da_ia ?? null,
        retorno: lead.retorno ?? null,
        prescritor: lead.prescritor ?? null,
        drograria: lead.drograria ?? null,
        data_recompra: toDateOnly(lead.data_recompra),
        mes_que_entrou: lead.mes_que_entrou ?? null,
        arquivo_receita: lead.arquivo_receita ?? null,
        id_t56: lead.id_t56 ?? null,
        objetivos_do_cliente: lead.objetivos_do_cliente ?? null,
        perfil_do_cliente: lead.perfil_do_cliente ?? null,
        recebedor: lead.recebedor ?? null,
        whatsapp_remote_lid: lead.whatsapp_remote_lid ?? null,
        status: lead.status ?? null,
        sh_status: lead.sh_status ?? null,
        channel_restrictions: toJson(lead.channelRestrictions ?? lead.channel_restrictions),
        ips: toJson(lead.ips),
        utm_tags: toJson(lead.utmTags ?? lead.utm_tags),
        numero: lead.numero ?? null,
        rua: lead.rua ?? null,
        pais: lead.pais ?? null,
        endereco_completo: lead.endereco_completo ?? null,
        referencia_entrega: lead.referencia_entrega ?? null,
        recebedor_qjl: lead.recebedor_qjl ?? null,
        forma_de_entrega: lead.forma_de_entrega ?? null,
        forma_pagamento: lead.forma_pagamento ?? null,
        parcelas: lead.parcelas ?? null,
        valor_do_frete: lead.valor_do_frete ?? null,
        valor_parcela: lead.valor_parcela ?? null,
        descontos: lead.descontos ?? null,
        id_apomax: lead.id_apomax ?? null,
        id_cliente_yampi: lead.id_cliente_yampi ?? lead.id_cliente_yampi_xpc ?? null,
        id_cliente_yampi_xpc: lead.id_cliente_yampi_xpc ?? null,
        id_transacao: lead.id_transacao ?? null,
        id_correio: lead.id_correio ?? null,
        codigo_de_rastreio: lead.codigo_de_rastreio ?? null,
        status_getnet: lead.status_getnet ?? null,
        status_pagamento: lead.status_pagamento ?? null,
        status_stapa: lead.status_stapa ?? null,
        status_melhor_envio: lead.status_melhor_envio ?? null,
        ultimo_tipo_de_frete: lead.ultimo_tipo_de_frete ?? null,
        url_etiqueta: lead.url_etiqueta ?? null,
        link_pagamento: lead.linkpagamento ?? lead.link_pagamento ?? null,
        numero_do_pedido: lead.numero_do_pedido ?? null,
        titulo_pedido: lead.titulo_pedido ?? null,
        total: lead.total ?? null,
        ord: lead.ord ?? null,
        req: lead.req ?? null,
        skugetnet: lead.skugetnet ?? null,
        cotar_frete_sedex: lead.cotar_frete_sedex ?? null,
        created_by_utm: lead.createdByUtm ?? lead.created_by_utm ?? null,
        data_de_nascimento_yampi: lead.data_de_nascimento_yampi ?? null,
        descricao_formula: lead.descricao_formula ?? null,
        data_ultima_compra: lead.data_ultima_compra ?? lead.ultimopedido ?? null
    };
}

// Função principal
async function main() {
    console.log('🚀 SINCRONIZAÇÃO RÁPIDA DE LEADS\n');
    console.log('='.repeat(60));
    
    // FASE 1: Buscar todos os leads do SprintHub
    console.log('\n📊 Fase 1: Buscando todos os leads do SprintHub...\n');
    
    let page = 0;
    let totalFetched = 0;
    
    while (true) {
        const leads = await fetchLeadsFromSprintHub(page);
        
        if (!leads || leads.length === 0) {
            break;
        }

        leads.forEach(lead => {
            if (lead.id) {
                sprintHubIds.add(BigInt(lead.id));
                sprintHubLeads.set(BigInt(lead.id), lead);
            }
        });

        totalFetched += leads.length;
        console.log(`📄 Página ${page + 1}: ${leads.length} leads (Total: ${totalFetched}, Únicos: ${sprintHubIds.size})`);
        
        page++;
        await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log(`\n✅ SprintHub: ${sprintHubIds.size} leads únicos encontrados\n`);

    // FASE 2: Buscar IDs do banco
    console.log('📊 Fase 2: Buscando IDs do banco...\n');
    
    const { data: dbLeads, error: dbError } = await supabase
        .from('leads')
        .select('id')
        .order('id', { ascending: true });

    if (dbError) {
        console.error('❌ Erro ao buscar leads do banco:', dbError.message);
        return;
    }

    const dbIds = new Set(dbLeads.map(l => BigInt(l.id)));
    console.log(`📊 Banco: ${dbIds.size} leads\n`);

    // FASE 3: Identificar leads para remover
    const idsToDelete = [];
    dbIds.forEach(id => {
        if (!sprintHubIds.has(id)) {
            idsToDelete.push(id);
        }
    });

    if (idsToDelete.length > 0) {
        console.log(`🗑️  Fase 3: Removendo ${idsToDelete.length} leads que não existem mais...\n`);
        
        // Deletar em lotes
        for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
            const batch = idsToDelete.slice(i, i + BATCH_SIZE);
            const { error } = await supabase
                .from('leads')
                .delete()
                .in('id', batch.map(id => id.toString()));
            
            if (error) {
                console.error(`❌ Erro ao deletar lote ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
            } else {
                console.log(`✅ Removidos ${Math.min(i + batch.length, idsToDelete.length)}/${idsToDelete.length} leads...`);
            }
        }
        
        console.log(`\n✅ ${idsToDelete.length} leads removidos\n`);
    } else {
        console.log('✅ Nenhum lead para remover\n');
    }

    // FASE 4: Sincronizar todos os leads
    console.log(`📊 Fase 4: Sincronizando ${sprintHubLeads.size} leads com todos os campos...\n`);
    
    let processed = 0;
    const leadsArray = Array.from(sprintHubLeads.values());
    
    // Processar em lotes
    for (let i = 0; i < leadsArray.length; i += BATCH_SIZE) {
        const batch = leadsArray.slice(i, i + BATCH_SIZE);
        const mapped = batch.map(lead => mapLeadComplete(lead));
        
        const { error } = await supabase
            .from('leads')
            .upsert(mapped, { onConflict: 'id', ignoreDuplicates: false });
        
        if (error) {
            console.error(`❌ Erro no lote ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
        } else {
            processed += batch.length;
            console.log(`✅ Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} leads (Total: ${processed}/${leadsArray.length})`);
        }
        
        // Delay pequeno entre lotes
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Verificar resultado final
    const { count: finalCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

    console.log('\n' + '='.repeat(60));
    console.log('✅ SINCRONIZAÇÃO CONCLUÍDA!');
    console.log('='.repeat(60));
    console.log(`📊 SprintHub: ${sprintHubIds.size} leads`);
    console.log(`📊 Banco: ${finalCount} leads`);
    console.log(`✅ Processados: ${processed}`);
    console.log(`🗑️  Removidos: ${idsToDelete.length}`);
    console.log('='.repeat(60) + '\n');
}

// Executar
main().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});

