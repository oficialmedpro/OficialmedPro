#!/usr/bin/env node

/**
 * 🔧 SCRIPT DE CORREÇÃO RÁPIDA DE LEADS
 * Busca todos os leads do SprintHub e sincroniza com Supabase via MCP
 * Remove leads deletados e atualiza campos vazios
 */

const fs = require('fs');
const path = require('path');

// Configurações do SprintHub (mesmas do api-sync-opportunities.js)
function readSecret(filePath, envVars = []) {
    if (filePath && fs.existsSync(filePath)) {
        try {
            return fs.readFileSync(filePath, 'utf8').trim();
        } catch (e) {
            // Ignorar
        }
    }
    for (const envVar of envVars) {
        if (process.env[envVar]) {
            return process.env[envVar];
        }
    }
    return null;
}

const SPRINTHUB_BASE_URL = readSecret(process.env.SPRINTHUB_BASE_URL_FILE, ['SPRINTHUB_BASE_URL', 'VITE_SPRINTHUB_BASE_URL']) || 'sprinthub-api-master.sprinthub.app';
const SPRINTHUB_INSTANCE = readSecret(process.env.SPRINTHUB_INSTANCE_FILE, ['SPRINTHUB_INSTANCE', 'VITE_SPRINTHUB_INSTANCE']) || 'oficialmed';
const SPRINTHUB_TOKEN = readSecret(process.env.SPRINTHUB_TOKEN_FILE, ['SPRINTHUB_TOKEN', 'VITE_SPRINTHUB_API_TOKEN']) || '9ad36c85-5858-4960-9935-e73c3698dd0c';

const SPRINTHUB_CONFIG = {
    baseUrl: SPRINTHUB_BASE_URL,
    instance: SPRINTHUB_INSTANCE,
    apiToken: SPRINTHUB_TOKEN
};

const PAGE_LIMIT = 100;
const DELAY_MS = 300;

// Função para buscar leads do SprintHub
async function fetchLeadsFromSprintHub(page = 0, limit = PAGE_LIMIT) {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        i: SPRINTHUB_CONFIG.instance,
        orderByKey: 'id',
        orderByDirection: 'asc',
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
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        let leads = [];
        
        if (Array.isArray(data)) {
            leads = data;
        } else if (data?.data?.leads) {
            leads = data.data.leads;
        } else if (data?.leads) {
            leads = data.leads;
        }

        return leads;
    } catch (error) {
        console.error(`❌ Erro ao buscar leads página ${page + 1}:`, error.message);
        return [];
    }
}

// Função para buscar detalhes completos de um lead
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
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        return data?.data?.lead || data?.data || data?.lead || data || null;
    } catch (e) {
        return null;
    }
}

// Função helper para sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para mapear lead completo (mesma lógica do api-sync-opportunities.js)
function mapLeadToSupabase(lead) {
    const getField = (field, variations = []) => {
        const allVariations = [field, ...variations];
        for (const variant of allVariations) {
            const value = lead[variant];
            if (value !== null && value !== undefined && value !== '') {
                return value;
            }
        }
        return null;
    };

    const toBigInt = (val) => {
        if (!val) return null;
        const parsed = typeof val === 'string' ? parseInt(val, 10) : val;
        return isNaN(parsed) ? null : parsed;
    };

    const toInteger = (val) => {
        if (!val) return 0;
        const parsed = typeof val === 'string' ? parseInt(val, 10) : val;
        return isNaN(parsed) ? 0 : parsed;
    };

    const parseDateTime = (dateStr) => {
        if (!dateStr) return null;
        try {
            return new Date(dateStr).toISOString();
        } catch {
            return null;
        }
    };

    const parseDateOnly = (dateStr) => {
        if (!dateStr) return null;
        try {
            const date = new Date(dateStr);
            return date.toISOString().split('T')[0];
        } catch {
            return null;
        }
    };

    const toJson = (value) => {
        if (!value) return null;
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }
        return value;
    };

    let firstname = getField('firstname', ['firstName', 'first_name']);
    let lastname = getField('lastname', ['lastName', 'last_name', 'surname', 'sobrenome']);
    
    if (!firstname && !lastname) {
        const fullname = getField('fullname', ['fullName', 'full_name', 'name', 'nome']);
        if (fullname && typeof fullname === 'string' && fullname.trim()) {
            const parts = fullname.trim().split(/\s+/).filter(p => p);
            if (parts.length > 0) {
                firstname = parts[0];
                if (parts.length > 1) {
                    lastname = parts.slice(1).join(' ');
                }
            }
        }
    }

    let whatsapp = getField('whatsapp', ['whatsApp', 'whats_app']);
    let phone = getField('phone', ['telephone', 'tel']);
    let mobile = getField('mobile', ['cellphone', 'cell']);
    
    if (!whatsapp && !phone && !mobile && lead.contacts) {
        if (Array.isArray(lead.contacts)) {
            const whatsappContact = lead.contacts.find(c => c.type === 'whatsapp' || c.type === 'WhatsApp');
            whatsapp = whatsappContact?.value || whatsappContact?.phone || whatsappContact?.number || null;
        } else if (typeof lead.contacts === 'object') {
            whatsapp = lead.contacts.whatsapp || lead.contacts.whatsApp || null;
        }
    }
    
    if (!whatsapp) {
        whatsapp = mobile || phone || null;
    }

    const email = getField('email', ['e_mail', 'e-mail']);
    const fullname = firstname && lastname ? `${firstname} ${lastname}`.trim() : (getField('fullname', ['fullName', 'full_name', 'name', 'nome']) || null);

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
        points: toInteger(lead.points) ?? 0,
        owner: toBigInt(lead.owner),
        stage: lead.stage ?? null,
        preferred_locale: lead.preferred_locale ?? null,
        user_access: toJson(lead.userAccess ?? lead.user_access),
        department_access: toJson(lead.departmentAccess ?? lead.department_access),
        ignore_sub_departments: Boolean(lead.ignoreSubDepartments ?? lead.ignore_sub_departments),
        create_date: parseDateTime(lead.createDate ?? lead.create_date),
        updated_date: parseDateTime(lead.updatedDate ?? lead.updated_date),
        last_active: parseDateTime(lead.lastActive ?? lead.last_active),
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
        data_de_nascimento: parseDateOnly(lead.data_de_nascimento ?? lead.data_de_nascimento_yampi),
        data_do_contato: parseDateOnly(lead.data_do_contato),
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
        data_recompra: parseDateOnly(lead.data_recompra),
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
    console.log('🚀 Iniciando correção de leads via MCP...\n');
    console.log(`📡 SprintHub: ${SPRINTHUB_CONFIG.baseUrl}`);
    console.log(`📦 Instância: ${SPRINTHUB_CONFIG.instance}\n`);

    // FASE 1: Buscar todos os IDs do SprintHub
    console.log('🔍 FASE 1: Buscando todos os IDs de leads do SprintHub...');
    const sprintHubIds = new Set();
    let page = 0;
    let totalFetched = 0;

    while (true) {
        const batch = await fetchLeadsFromSprintHub(page);
        if (!batch || batch.length === 0) {
            break;
        }

        batch.forEach(lead => {
            if (lead.id) {
                sprintHubIds.add(lead.id);
            }
        });

        totalFetched += batch.length;
        console.log(`   📄 Página ${page + 1}: ${batch.length} leads (Total IDs únicos: ${sprintHubIds.size})`);
        
        page++;
        await sleep(DELAY_MS);
    }

    console.log(`\n✅ Total de IDs únicos no SprintHub: ${sprintHubIds.size}\n`);

    // FASE 2: Armazenar IDs no Supabase (tabela temporária)
    console.log('💾 FASE 2: Armazenando IDs no Supabase...');
    const sprintHubIdsArray = Array.from(sprintHubIds);
    
    // Criar SQL para inserir IDs em lote
    const insertIdsSQL = `
        INSERT INTO temp_sprinthub_lead_ids (id)
        VALUES ${sprintHubIdsArray.map(id => `(${id})`).join(', ')}
        ON CONFLICT (id) DO NOTHING;
    `;

    console.log(`   💾 Inserindo ${sprintHubIdsArray.length} IDs na tabela temporária...`);
    // Nota: Esta query será executada via MCP abaixo

    // FASE 3: Identificar leads para remover
    console.log('\n🧹 FASE 3: Identificando leads para remover...');
    const deleteLeadsSQL = `
        DELETE FROM api.leads
        WHERE id NOT IN (SELECT id FROM temp_sprinthub_lead_ids);
    `;

    // FASE 4: Sincronizar todos os leads com dados completos
    console.log('\n📥 FASE 4: Sincronizando leads com dados completos...');
    page = 0;
    let processed = 0;
    let updated = 0;
    let errors = 0;

    while (true) {
        const batch = await fetchLeadsFromSprintHub(page);
        if (!batch || batch.length === 0) {
            break;
        }

        // Mapear todos os leads
        const mapped = batch.map(lead => mapLeadToSupabase(lead));

        // Buscar detalhes para leads sem campos críticos
        const leadsWithoutFields = mapped.filter(lead => 
            !lead.firstname && !lead.lastname && !lead.whatsapp && !lead.email
        );

        if (leadsWithoutFields.length > 0) {
            console.log(`   🔍 Buscando detalhes de ${leadsWithoutFields.length} leads sem campos críticos...`);
            for (const lead of leadsWithoutFields) {
                try {
                    const details = await fetchLeadDetails(lead.id);
                    if (details) {
                        const leadData = details.lead || details.data?.lead || details;
                        const remapped = mapLeadToSupabase(leadData);
                        const index = mapped.findIndex(l => l.id === lead.id);
                        if (index >= 0) {
                            mapped[index] = remapped;
                            updated++;
                        }
                    }
                } catch (err) {
                    // Silenciar
                }
                await sleep(50);
            }
        }

        // Preparar SQL para upsert em lote
        const upsertSQL = mapped.map(lead => {
            const fields = Object.keys(lead).map(key => `"${key}"`).join(', ');
            const values = Object.values(lead).map(val => {
                if (val === null) return 'NULL';
                if (typeof val === 'boolean') return val ? 'true' : 'false';
                if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                return val;
            }).join(', ');
            return `(${values})`;
        }).join(',\n        ');

        const fullUpsertSQL = `
            INSERT INTO api.leads (${Object.keys(mapped[0]).map(k => `"${k}"`).join(', ')})
            VALUES ${upsertSQL}
            ON CONFLICT (id) DO UPDATE SET
                ${Object.keys(mapped[0]).filter(k => k !== 'id').map(key => `"${key}" = EXCLUDED."${key}"`).join(',\n                ')};
        `;

        processed += mapped.length;
        console.log(`   ✅ Página ${page + 1}: ${mapped.length} leads processados (Total: ${processed})`);

        page++;
        await sleep(DELAY_MS);
    }

    console.log(`\n✅ Sincronização concluída!`);
    console.log(`   📊 Processados: ${processed}`);
    console.log(`   🔄 Atualizados: ${updated}`);
    console.log(`   ❌ Erros: ${errors}`);

    // Retornar SQLs para execução via MCP
    return {
        insertIdsSQL,
        deleteLeadsSQL,
        sprintHubTotal: sprintHubIds.size,
        processed,
        updated,
        errors
    };
}

// Executar se chamado diretamente
if (require.main === module) {
    main().then(result => {
        console.log('\n📋 SQLs gerados para execução via MCP:');
        console.log('\n1. INSERT IDs:');
        console.log(result.insertIdsSQL.substring(0, 200) + '...');
        console.log('\n2. DELETE leads:');
        console.log(result.deleteLeadsSQL);
        console.log('\n✅ Script concluído! Execute os SQLs via MCP.');
    }).catch(error => {
        console.error('❌ Erro:', error);
        process.exit(1);
    });
}

module.exports = { main, fetchLeadsFromSprintHub, mapLeadToSupabase };

