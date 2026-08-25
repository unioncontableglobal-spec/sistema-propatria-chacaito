const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseExcelDate(excelDate) {
  // Excel dates are number of days since Jan 1, 1900
  // Subtracting 25569 to get Unix timestamp in days since Jan 1, 1970
  // Multiplying by 86400 * 1000 to get milliseconds
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date;
}

async function getSocioId(ficha) {
  if (!ficha) return null;
  const socio = await prisma.socio.findFirst({
    where: { ficha: String(ficha) }
  });
  return socio ? socio.id : null;
}

async function main() {
  console.log('Iniciando migración de recibos...');
  
  // Borrar transacciones existentes (opcional pero seguro para reiniciar)
  await prisma.formaPago.deleteMany({});
  await prisma.transaccion.deleteMany({});
  console.log('Tabla de transacciones limpiada.');

  const workbook = xlsx.readFile('../BASE DE DATOS  Entreda_Primer_Trimestre_2026.xlsx');
  
  // --- MIGRAR INGRESOS ---
  const sheetIngresos = workbook.Sheets['INGRESOS RECIBOS'];
  const dataIngresos = xlsx.utils.sheet_to_json(sheetIngresos, { header: 1 });
  
  let ingresosAgregados = 0;
  for (let i = 1; i < dataIngresos.length; i++) {
    const row = dataIngresos[i];
    if (!row || row.length < 3 || !row[2]) continue; // Skip empty rows or rows without receipt
    
    const fecha = parseExcelDate(row[1]);
    const recibo = String(row[2]);
    const ficha = row[3];
    const monto = Number(row[6]) || 0;
    
    // Formatting mes: YYYY-MM
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const year = fecha.getFullYear();
    const mes = `${year}-${month}`;

    const socioId = await getSocioId(ficha);

    await prisma.transaccion.create({
      data: {
        tipo: 'INGRESO',
        recibo,
        fecha,
        mes,
        monto_bs: monto,
        socioId,
        clasificacion: 'CUOTA',
        detalle: 'Migración desde Excel'
      }
    });
    ingresosAgregados++;
  }
  console.log(`✅ Ingresos migrados: ${ingresosAgregados}`);

  // --- MIGRAR EGRESOS ---
  const sheetEgresos = workbook.Sheets['EGRESOS RECIBOS'];
  const dataEgresos = xlsx.utils.sheet_to_json(sheetEgresos, { header: 1 });
  
  let egresosAgregados = 0;
  for (let i = 8; i < dataEgresos.length; i++) {
    const row = dataEgresos[i];
    if (!row || row.length < 3 || !row[1] || typeof row[0] !== 'number') continue; 
    
    const fecha = parseExcelDate(row[0]);
    const recibo = String(row[1]);
    const ficha = row[2];
    const monto = Number(row[5]) || 0;
    const detalle = String(row[6] || '');
    
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const year = fecha.getFullYear();
    const mes = `${year}-${month}`;

    const socioId = await getSocioId(ficha);

    await prisma.transaccion.create({
      data: {
        tipo: 'EGRESO',
        recibo,
        fecha,
        mes,
        monto_bs: monto,
        socioId,
        clasificacion: 'GASTO',
        detalle
      }
    });
    egresosAgregados++;
  }
  console.log(`✅ Egresos migrados: ${egresosAgregados}`);
  
  console.log('Migración completada con éxito.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
