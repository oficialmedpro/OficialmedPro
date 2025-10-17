const express = require('express');
const router = express.Router();

// Endpoint para processar segmentos em lote (100 leads por vez)
// Domínio de produção: https://bi.oficialmed.com.br/api/processar-segmentos-lote
router.post('/processar-segmentos-lote', async (req, res) => {
  // Verificar token de autenticação
  const authToken = req.headers['x-auth-token'];
  const expectedToken = process.env.CRON_AUTH_TOKEN || 'meu-token-super-secreto-2024';
  
  if (!authToken || authToken !== expectedToken) {
    console.log('❌ Tentativa de acesso não autorizada ao endpoint de cron job');
    return res.status(401).json({
      success: false,
      error: 'Token de autenticação inválido'
    });
  }
  try {
    console.log('🚀 Iniciando processamento de segmentos em lote...');
    
    // Buscar segmentos ativos
    const segmentosResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/segmento_automatico?ativo=eq.true&select=*`, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!segmentosResponse.ok) {
      throw new Error(`Erro ao buscar segmentos: ${segmentosResponse.status}`);
    }

    const segmentos = await segmentosResponse.json();
    console.log(`📋 Encontrados ${segmentos.length} segmentos para processar`);

    const resultados = [];

    for (const segmento of segmentos) {
      console.log(`🔄 Processando segmento: ${segmento.nome} (ID: ${segmento.segmento_id})`);
      
      try {
        // Buscar leads do segmento (100 por vez)
        const leadsResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/leads?segmento=eq.${segmento.segmento_id}&enviado_callix=eq.false&limit=100`, {
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (!leadsResponse.ok) {
          throw new Error(`Erro ao buscar leads: ${leadsResponse.status}`);
        }

        const leads = await leadsResponse.json();
        console.log(`📊 Encontrados ${leads.length} leads para enviar`);

        if (leads.length === 0) {
          console.log(`✅ Segmento ${segmento.nome} - Nenhum lead para enviar`);
          continue;
        }

        // Enviar lote para Callix (100 leads de uma vez)
        const enviado = await enviarLoteParaCallix(leads, segmento, process.env);
        
        if (enviado) {
          console.log(`✅ Segmento ${segmento.nome} - ${leads.length} leads enviados com sucesso`);
          resultados.push({
            segmento_id: segmento.segmento_id,
            nome: segmento.nome,
            leads_enviados: leads.length,
            sucesso: true
          });
        } else {
          console.log(`❌ Segmento ${segmento.nome} - Erro ao enviar leads`);
          resultados.push({
            segmento_id: segmento.segmento_id,
            nome: segmento.nome,
            leads_enviados: 0,
            sucesso: false
          });
        }

        // Delay de 60 segundos entre segmentos (rate limit Callix)
        if (segmentos.indexOf(segmento) < segmentos.length - 1) {
          console.log('⏳ Aguardando 60s para respeitar rate limit...');
          await new Promise(resolve => setTimeout(resolve, 60000));
        }

      } catch (error) {
        console.error(`❌ Erro ao processar segmento ${segmento.nome}:`, error);
        resultados.push({
          segmento_id: segmento.segmento_id,
          nome: segmento.nome,
          erro: error.message,
          sucesso: false
        });
      }
    }

    console.log('✅ Processamento concluído:', resultados);
    
    res.json({
      success: true,
      message: `${segmentos.length} segmentos processados`,
      resultados
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Função para enviar lote de leads para Callix
async function enviarLoteParaCallix(leads, segmento, env) {
  try {
    if (leads.length === 0) {
      console.log('📦 Nenhum lead para enviar no lote.');
      return true;
    }

    console.log(`📤 ENVIANDO ${leads.length} LEADS PARA CALLIX EM LOTE (campaign: ${segmento.campaign_id})`);

    // Preparar dados para Callix
    const importData = leads.map(lead => ({
      Nome: lead.firstname || 'Lead sem nome',
      Sobrenome: lead.lastname || '',
      link: `https://oficialmed.sprinthub.app/sh/leads/profile/${lead.id}`,
      email: lead.email || '',
      telefone: corrigirTelefoneBrasileiro(lead.whatsapp || lead.phone || ''),
      cidade: lead.city || '',
      estado: lead.state || '',
      'Data-compra': lead.data_ultima_compra ? formatarDataDDMMAAAA(lead.data_ultima_compra) : '',
      Observacao: lead.observacao || '',
      Formula: lead.descricao_formula || '',
      'tipo-compra': lead.tipo_de_compra || '',
      'objetivo-cliente': lead.objetivos_do_cliente || ''
    }));

    // Enviar para Callix API
    const callixResponse = await fetch('https://oficialmed.callix.com.br/api/v1/campaign_contacts_async', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer 68b46239-a040-4703-b8e9-c0b25b519e64`,
        'Content-Type': 'application/vnd.api+json'
      },
      body: JSON.stringify({
        data: {
          type: "campaign_contacts_async",
          attributes: {
            remove_duplicated_phones: "true",
            import_data: importData
          },
          relationships: {
            campaign_list: {
              data: {
                type: "campaign_lists",
                id: segmento.campaign_id
              }
            }
          }
        }
      })
    });

    if (!callixResponse.ok) {
      const errorText = await callixResponse.text();
      throw new Error(`Callix API error ${callixResponse.status}: ${errorText}`);
    }

    const callixResult = await callixResponse.json();
    console.log(`✅ LOTE ENVIADO PARA CALLIX COM SUCESSO! ID: ${callixResult.data.id}`);

    // Atualizar status dos leads no Supabase
    const updates = leads.map(lead => ({
      id: lead.id,
      enviado_callix: true,
      data_envio_callix: new Date().toISOString(),
      callix_id: callixResult.data.id.toString(),
      status_callix: 'sent'
    }));

    // Bulk update leads table
    for (const update of updates) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/leads?id=eq.${update.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(update)
      });
    }

    console.log(`✅ TOTAL DE LEADS ENVIADOS: ${leads.length}`);
    return true;

  } catch (error) {
    console.error(`❌ Erro ao enviar lote para Callix:`, error);
    return false;
  }
}

// Função para corrigir telefone brasileiro
function corrigirTelefoneBrasileiro(telefone) {
  try {
    if (!telefone || telefone.trim() === '') {
      return '';
    }
    
    // Remover espaços e caracteres especiais
    let telLimpo = telefone.replace(/\D/g, '');
    
    // Se começa com 55 (DDI do Brasil), remover
    if (telLimpo.startsWith('55')) {
      telLimpo = telLimpo.substring(2);
    }
    
    // Se ainda tem mais de 11 dígitos após remover DDI, pode ser que tenha 55 duplicado
    if (telLimpo.length > 11 && telLimpo.startsWith('55')) {
      telLimpo = telLimpo.substring(2);
    }
    
    // Adicionar 9 faltante após DDD
    if (telLimpo.length === 10) {
      const ddd = telLimpo.substring(0, 2);
      const numero = telLimpo.substring(2);
      telLimpo = ddd + '9' + numero;
      console.log(`📱 Telefone corrigido: ${telefone} → ${telLimpo}`);
    }
    
    return telLimpo;
  } catch (error) {
    console.error('❌ Erro ao processar telefone:', telefone, error);
    return telefone;
  }
}

// Função para formatar data
function formatarDataDDMMAAAA(data) {
  try {
    if (!data) return '';
    const dataObj = new Date(data);
    if (isNaN(dataObj.getTime())) return '';
    
    const dia = dataObj.getDate().toString().padStart(2, '0');
    const mes = (dataObj.getMonth() + 1).toString().padStart(2, '0');
    const ano = dataObj.getFullYear().toString();
    return `${dia}/${mes}/${ano}`;
  } catch (error) {
    return '';
  }
}

module.exports = router;
