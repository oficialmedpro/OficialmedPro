import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '..', 'docs', 'Central Controle Comercial OficialMed.xlsx');

console.log('📄 Analisando abas específicas...\n');

try {
    const workbook = XLSX.readFile(filePath);
    
    // Analisar "Faturamento Geral 2025"
    if (workbook.SheetNames.includes('Faturamento Geral 2025')) {
        console.log('=== ABA: Faturamento Geral 2025 ===');
        const worksheet = workbook.Sheets['Faturamento Geral 2025'];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, 
            defval: null,
            raw: false 
        });
        
        console.log(`Total de linhas: ${jsonData.length}\n`);
        console.log('Primeiras 30 linhas:');
        jsonData.slice(0, 30).forEach((row, index) => {
            if (row && row.length > 0 && row.some(cell => cell !== null && cell !== '')) {
                console.log(`Linha ${index + 1}:`, row.filter(cell => cell !== null && cell !== '').slice(0, 15));
            }
        });
    }
    
    // Analisar "GERAL - 12"
    if (workbook.SheetNames.includes('GERAL - 12')) {
        console.log('\n\n=== ABA: GERAL - 12 ===');
        const worksheet = workbook.Sheets['GERAL - 12'];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, 
            defval: null,
            raw: false 
        });
        
        console.log(`Total de linhas: ${jsonData.length}\n`);
        console.log('Primeiras 50 linhas:');
        jsonData.slice(0, 50).forEach((row, index) => {
            if (row && row.length > 0 && row.some(cell => cell !== null && cell !== '')) {
                console.log(`Linha ${index + 1}:`, row.filter(cell => cell !== null && cell !== '').slice(0, 20));
            }
        });
    }
    
    console.log('\n\n✅ Análise concluída!');
} catch (error) {
    console.error('❌ Erro:', error);
}

