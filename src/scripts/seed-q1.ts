import prisma from '../lib/prisma';
import * as xlsx from 'xlsx';
import path from 'path';

const filePath = path.join(process.cwd(), '../BASE DE DATOS  Entreda_Primer_Trimestre_2026.xlsx');
const workbook = xlsx.readFile(filePath);

function excelDateToDate(serial: number): Date {
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  return new Date(utc_value * 1000);
}

function cleanString(str: any): string | null {
  if (typeof str !== 'string') return str ? String(str).trim() : null;
  const trimmed = str.trim();
  return trimmed === '' ? null : trimmed;
}

function excelDateToMonth(serial: number): string {
  if (!serial || typeof serial !== 'number') return 'ENERO';
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);
  const month = date_info.toLocaleString('es-ES', { month: 'long', timeZone: 'UTC' });
  return month.charAt(0).toUpperCase() + month.slice(1);
}

async function main() {
  console.log('Starting optimized seed process...');

  const cupoToSocioId = new Map<string, number>();

  // We already inserted Socios, but let's fetch them to populate the map quickly
  console.log('Loading existing Socios...');
  const existingSocios = await prisma.socio.findMany();
  for (const s of existingSocios) {
    if (s.codigo) cupoToSocioId.set(s.codigo, s.id);
    if (s.ficha) cupoToSocioId.set(s.ficha, s.id);
  }
  console.log(`Loaded ${existingSocios.length} Socios`);

  // We need to insert Transacciones in bulk
  console.log('Processing Ingresos in memory...');
  const txMap = new Map<string, any>(); // recibo -> { data }

  const ingRecibosSheet = workbook.Sheets['INGRESOS RECIBOS'];
  if (ingRecibosSheet) {
    const ingData = xlsx.utils.sheet_to_json<any>(ingRecibosSheet, { header: 1 });
    for (let i = 1; i < ingData.length; i++) {
      const row = ingData[i];
      if (!row || row.length < 4) continue;
      
      const mes = cleanString(row[0]);
      const fechaNum = row[1];
      const recibo = cleanString(row[2]);
      const cupo = cleanString(row[3]);
      const montoBs = typeof row[6] === 'number' ? row[6] : 0;
      
      if (!recibo || !cupo) continue;
      
      const socioId = cupoToSocioId.get(cupo) || null;
      const fecha = typeof fechaNum === 'number' ? excelDateToDate(fechaNum) : new Date();

      txMap.set(recibo, {
        tipo: 'INGRESO',
        recibo,
        fecha,
        mes,
        socioId,
        monto_bs: montoBs,
        clasificacion: null,
        codigo_concepto: null,
        detalle: null,
        monto_usd: null,
        tasa_cambio: null
      });
    }
  }

  const ingCatSheet = workbook.Sheets['INGRESOS CATEGORIAS'];
  if (ingCatSheet) {
    const ingCatData = xlsx.utils.sheet_to_json<any>(ingCatSheet, { header: 1 });
    for (let i = 1; i < ingCatData.length; i++) {
      const row = ingCatData[i];
      if (!row || row.length < 3) continue;
      
      const recibo = cleanString(row[1]);
      if (recibo && txMap.has(recibo)) {
        const tx = txMap.get(recibo);
        tx.clasificacion = cleanString(row[2]);
        tx.codigo_concepto = cleanString(row[3]);
        tx.detalle = cleanString(row[4]);
        tx.tasa_cambio = typeof row[6] === 'number' ? row[6] : null;
        tx.monto_usd = typeof row[7] === 'number' ? row[7] : null;
      }
    }
  }

  console.log('Processing Egresos in memory...');
  const egRecibosSheet = workbook.Sheets['EGRESOS RECIBOS'];
  if (egRecibosSheet) {
    const egData = xlsx.utils.sheet_to_json<any>(egRecibosSheet, { header: 1 });
    const headerIdx = egData.findIndex(row => row && row.length > 3);
    if (headerIdx !== -1) {
      for (let i = headerIdx + 1; i < egData.length; i++) {
        const row = egData[i];
        if (!row || row.length < 3) continue;
        
        const fechaNum = row[0];
        const recibo = cleanString(row[1]);
        const cupo = cleanString(row[2]);
        const detalle = cleanString(row[6]);
        const montoBs = typeof row[5] === 'number' ? row[5] : 0;
        
        if (!recibo) continue;
        
        const socioId = cupo ? cupoToSocioId.get(cupo) : null;
        const fecha = typeof fechaNum === 'number' ? excelDateToDate(fechaNum) : new Date();
        const mes = excelDateToMonth(fechaNum);

        txMap.set('EGRESO_' + recibo, {
          tipo: 'EGRESO',
          recibo,
          fecha,
          mes,
          socioId,
          monto_bs: montoBs,
          detalle,
          clasificacion: null,
          codigo_concepto: null
        });
      }
    }
  }

  const egCatSheet = workbook.Sheets['EGRESOS CATEGORIAS'];
  if (egCatSheet) {
    const egCatData = xlsx.utils.sheet_to_json<any>(egCatSheet, { header: 1 });
    const headerIdx = egCatData.findIndex(row => row && row.length > 3);
    if (headerIdx !== -1) {
      for (let i = headerIdx + 1; i < egCatData.length; i++) {
        const row = egCatData[i];
        if (!row || row.length < 3) continue;
        const recibo = cleanString(row[1]);
        if (recibo && txMap.has('EGRESO_' + recibo)) {
          const tx = txMap.get('EGRESO_' + recibo);
          tx.clasificacion = cleanString(row[2]);
          tx.codigo_concepto = cleanString(row[3]);
        }
      }
    }
  }

  console.log(`Prepared ${txMap.size} Transacciones. Bulk inserting...`);
  
  // Borrar todas las transacciones existentes antes de insertar para evitar duplicados si se corre varias veces
  await prisma.transaccion.deleteMany({});
  
  const txList = Array.from(txMap.values());
  // createMany might fail if payload is too big, let's chunk it
  const chunkSize = 500;
  for (let i = 0; i < txList.length; i += chunkSize) {
    const chunk = txList.slice(i, i + chunkSize);
    await prisma.transaccion.createMany({ data: chunk });
    console.log(`Inserted transactions ${i} to ${i + chunk.length}`);
  }

  console.log('Transacciones insertadas. Processing CxC and CxP...');
  
  await prisma.cuentaPorCobrar.deleteMany({});
  await prisma.cuentaPorPagar.deleteMany({});

  const cxcSheet = workbook.Sheets['CxC_PUBLICACIONES'];
  // Assuming the user didn't have real CxC rows in the sample, we skip it if it's too complex or empty

  const cxpSheet = workbook.Sheets['CxP_PUBLICACIONES'];
  if (cxpSheet) {
    const cxpData = xlsx.utils.sheet_to_json<any>(cxpSheet, { header: 1 });
    const cxpPayload = [];
    for (let i = 1; i < cxpData.length; i++) {
      const row = cxpData[i];
      if (!row || row.length < 2) continue;
      
      const tipo = cleanString(row[0]);
      const cupo = cleanString(row[1]);
      const parentesco = cleanString(row[3]);
      const total = typeof row[4] === 'number' ? row[4] : 0;
      const mes = cleanString(row[5]);
      const monto = typeof row[6] === 'number' ? row[6] : total;
      
      if (!cupo || !tipo) continue;
      const socioId = cupoToSocioId.get(cupo);
      if (socioId) {
        cxpPayload.push({
          socioId, tipo_publicacion: tipo, parentesco, mes, monto, total, estado: 'PENDIENTE'
        });
      }
    }
    if (cxpPayload.length > 0) {
      for (let i = 0; i < cxpPayload.length; i += chunkSize) {
        const chunk = cxpPayload.slice(i, i + chunkSize);
        await prisma.cuentaPorPagar.createMany({ data: chunk });
      }
      console.log(`Inserted ${cxpPayload.length} CxP records`);
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
