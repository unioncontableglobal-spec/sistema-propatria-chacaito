const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getTransaccionId(recibo) {
  if (!recibo) return null;
  const t = await prisma.transaccion.findFirst({
    where: { recibo: String(recibo) }
  });
  return t ? t.id : null;
}

async function main() {
  console.log('Iniciando migración de FORMAS DE PAGO...');
  
  // Limpiamos las formas de pago primero
  await prisma.formaPago.deleteMany({});
  console.log('Tabla de formas de pago limpiada.');

  const workbook = xlsx.readFile('../BASE DE DATOS  Entreda_Primer_Trimestre_2026.xlsx');
  
  // --- MIGRAR FORMAS DE PAGO INGRESOS ---
  const sheetIngresos = workbook.Sheets['INGRESOS FORMAS DE PAGO'];
  const dataIngresos = xlsx.utils.sheet_to_json(sheetIngresos, { header: 1 });
  
  let fpIngresosAgregados = 0;
  for (let i = 1; i < dataIngresos.length; i++) {
    const row = dataIngresos[i];
    if (!row || row.length < 3 || !row[1]) continue; 
    
    const recibo = String(row[1]);
    const tipo_pago = String(row[3] || 'Desconocido');
    const referencia = String(row[4] || '');
    const banco = String(row[5] || '');
    const monto = Number(row[8]) || Number(row[6]) || 0;
    
    const transaccionId = await getTransaccionId(recibo);
    
    if (transaccionId) {
      await prisma.formaPago.create({
        data: {
          transaccionId,
          tipo_pago,
          referencia,
          banco,
          monto_bs: monto
        }
      });
      fpIngresosAgregados++;
    }
  }
  console.log(`✅ Formas de pago Ingresos migradas: ${fpIngresosAgregados}`);

  // --- MIGRAR FORMAS DE PAGO EGRESOS ---
  const sheetEgresos = workbook.Sheets['EGRESOS FORMAS DE PAGO'];
  const dataEgresos = xlsx.utils.sheet_to_json(sheetEgresos, { header: 1 });
  
  let fpEgresosAgregados = 0;
  for (let i = 4; i < dataEgresos.length; i++) {
    const row = dataEgresos[i];
    if (!row || row.length < 3 || !row[1]) continue; 
    
    const recibo = String(row[1]);
    const tipo_pago = String(row[3] || 'Desconocido');
    const referencia = String(row[4] || '');
    const banco = String(row[5] || '');
    const monto = Number(row[8]) || Number(row[6]) || 0;
    
    const transaccionId = await getTransaccionId(recibo);

    if (transaccionId) {
      await prisma.formaPago.create({
        data: {
          transaccionId,
          tipo_pago,
          referencia,
          banco,
          monto_bs: monto
        }
      });
      fpEgresosAgregados++;
    }
  }
  console.log(`✅ Formas de pago Egresos migradas: ${fpEgresosAgregados}`);
  
  console.log('Migración de Formas de Pago completada con éxito.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
