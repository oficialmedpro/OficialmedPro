import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '..', 'docs', 'Central Controle Comercial OficialMed.xlsx');

console.log('📄 Analisando planilha:', filePath);

if (!fs.existsSync(filePath)) {
    console.error('❌ Arquivo não encontrado!');
    process.exit(1);
}

try {
    const workbook = XLSX.readFile(filePath);
    
    console.log('\n📋 Abas encontradas:');
    workbook.SheetNames.forEach((name, index) => {
        console.log(`  ${index + 1}. ${name}`);
    });
    
    // Analisar cada aba
    workbook.SheetNames.forEach((sheetName) => {
        console.log(`\n\n=== ABA: ${sheetName} ===`);
        const worksheet = workbook.Sheets[sheetName];
        
        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, 
            defval: null,
            raw: false 
        });
        
        console.log(`Total de linhas: ${jsonData.length}`);
        
        // Mostrar primeiras 20 linhas
        console.log('\nPrimeiras linhas:');
        jsonData.slice(0, 20).forEach((row, index) => {
            if (row && row.length > 0 && row.some(cell => cell !== null && cell !== '')) {
                console.log(`Linha ${index + 1}:`, row.filter(cell => cell !== null && cell !== '').slice(0, 10));
            }
        });
        
        // Tentar identificar fórmulas
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        let formulasFound = 0;
        for (let R = range.s.r; R <= Math.min(range.s.r + 50, range.e.r); ++R) {
            for (let C = range.s.c; C <= Math.min(range.s.c + 20, range.e.c); ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                const cell = worksheet[cellAddress];
                if (cell && cell.f) {
                    if (formulasFound < 10) {
                        console.log(`\nFórmula em ${cellAddress}: ${cell.f}`);
                        console.log(`  Valor: ${cell.v || cell.w || 'N/A'}`);
                    }
                    formulasFound++;
                }
            }
        }
        if (formulasFound > 0) {
            console.log(`\nTotal de fórmulas encontradas: ${formulasFound}`);
        }
    });
    
    console.log('\n\n✅ Análise concluída!');
} catch (error) {
    console.error('❌ Erro ao processar planilha:', error);
    process.exit(1);
}

