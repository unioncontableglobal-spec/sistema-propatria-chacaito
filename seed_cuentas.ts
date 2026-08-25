import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient();

async function main() {
  console.log('Reading Excel file...');
  const workbook = xlsx.readFile('../Sistema de Contabilidad MS369.xlsm');
  
  const planSheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('plan'));
  if (!planSheetName) {
    console.error('Plan sheet not found');
    return;
  }
  
  const planData = xlsx.utils.sheet_to_json(workbook.Sheets[planSheetName], { header: 1 });
  
  // Start from row 2 (index 2) as seen in previous output
  let importedCount = 0;
  
  for (let i = 2; i < planData.length; i++) {
    const row = planData[i] as any[];
    if (!row || row.length < 2) continue;
    
    const codigoRaw = row[0];
    const nombreRaw = row[1];
    const tipoSaldoRaw = row[2];
    const claseRaw = row[3];
    
    if (!codigoRaw || !nombreRaw) continue;
    
    const codigo = String(codigoRaw).trim();
    const nombre = String(nombreRaw).trim();
    let tipoSaldo = 'DEUDOR';
    if (tipoSaldoRaw === 'A' || tipoSaldoRaw === 'ACREEDOR') tipoSaldo = 'ACREEDOR';
    
    let clase = 'REAL';
    if (claseRaw === 'N' || claseRaw === 'NOMINAL') clase = 'NOMINAL';
    
    // Upsert to avoid duplicates if run multiple times
    try {
      await prisma.cuentaContable.upsert({
        where: { codigo },
        update: { nombre, tipoSaldo, clase },
        create: { codigo, nombre, tipoSaldo, clase }
      });
      importedCount++;
    } catch (e) {
      console.error(`Error importing row ${i}: ${codigo} - ${nombre}`, e);
    }
  }
  
  console.log(`Successfully imported/updated ${importedCount} cuentas.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
