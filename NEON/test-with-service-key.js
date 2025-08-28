/**
 * ⚡ TESTE RÁPIDO COM SERVICE ROLE KEY
 */

const https = require('https');

const SUPABASE_CONFIG = {
    url: 'https://agdffspstbxeqhqtltvb.supabase.co',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA'
};

function insertTestData() {
    const testData = {
        id: 888888,
        title: 'TESTE COM SERVICE ROLE',
        value: 2500.00,
        crm_column: 130,
        lead_id: 98064,
        sequence: 0,
        status: 'open',
        create_date: new Date().toISOString(),
        update_date: new Date().toISOString(),
        archived: 0,
        synced_at: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(testData);
        
        const options = {
            hostname: 'agdffspstbxeqhqtltvb.supabase.co',
            port: 443,
            path: '/rest/v1/oportunidade_sprint',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Prefer': 'return=representation',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        console.log('💾 INSERINDO COM SERVICE ROLE...');
        
        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                console.log(`📊 STATUS: ${res.statusCode}`);
                console.log(`📄 RESPOSTA: ${responseData}`);
                
                if (res.statusCode === 201) {
                    console.log('🎉 SUCESSO!');
                    resolve(JSON.parse(responseData));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function quickTest() {
    try {
        console.log('⚡ TESTE COM SERVICE ROLE KEY');
        console.log('=============================');
        
        const result = await insertTestData();
        console.log('✅ INSERÇÃO FUNCIONOU!');
        
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

quickTest();
