// migrate-formaspago-turso.mjs
// Migra las Formas de Pago desde el Excel a Turso Cloud
import { createClient } from '@libsql/client';
import xlsx from 'xlsx';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function getTransaccionId(recibo) {
  if (!recibo) return null;
  const r = await client.execute({
    sql: 'SELECT id FROM Transaccion WHERE recibo = ? LIMIT 1',
    args: [String(recibo)]
  });
  return r.rows.length > 0 ? r.rows[0].id : null;
}

async function main() {
  console.log('🚀 Iniciando migración de FORMAS DE PAGO a Turso...');

  // Limpiar tabla primero
  await client.execute('DELETE FROM FormaPago');
  console.log('✅ Tabla FormaPago limpiada');

  const wb = xlsx.readFile('../BASE DE DATOS  Entreda_Primer_Trimestre_2026.xlsx');

  // ---- INGRESOS FORMAS DE PAGO ----
  const shFP = wb.Sheets['INGRESOS FORMAS DE PAGO'];
  const fpData = xlsx.utils.sheet_to_json(shFP, { header: 1 });

  let ingresosOk = 0, ingresosFail = 0;
  for (let i = 1; i < fpData.length; i++) {
    const row = fpData[i];
    if (!row || !row[1]) continue;

    const recibo = String(row[1]).trim();
    const tipo_pago = String(row[3] || 'Efectivo').trim();
    const referencia = String(row[4] || '').trim();
    const banco = String(row[5] || '').trim();
    const monto_bs = Number(row[8]) || Number(row[6]) || 0;
    const tasa = row[7] ? Number(row[7]) : null;
    const monto_usd = tasa && tasa > 0 ? monto_bs / tasa : null;
    const moneda = String(row[9] || 'Bolivares');

    // Normalizar tipo de pago
    let tipo_normalizado = tipo_pago;
    if (tipo_pago.includes('EFECTIVO') || tipo_pago.includes('Efectivo')) tipo_normalizado = 'Efectivo';
    else if (tipo_pago.includes('TRANSFER') || tipo_pago.includes('Transfer')) tipo_normalizado = 'Transferencia';
    else if (tipo_pago.includes('MOVIL') || tipo_pago.includes('Movil') || tipo_pago.includes('MÓVIL')) tipo_normalizado = 'Pago Móvil';
    else if (tipo_pago.includes('CANJE') || tipo_pago.includes('Canje')) tipo_normalizado = 'Canje';

    const transaccionId = await getTransaccionId(recibo);
    if (!transaccionId) {
      ingresosFail++;
      continue;
    }

    try {
      await client.execute({
        sql: 'INSERT INTO FormaPago (transaccionId, tipo_pago, referencia, banco, monto_bs, tasa_cambio, monto_usd) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [transaccionId, tipo_normalizado, referencia, banco, monto_bs, tasa, monto_usd]
      });
      ingresosOk++;
    } catch (e) {
      ingresosFail++;
    }
  }
  console.log(`✅ Formas de Pago INGRESOS: ${ingresosOk} migradas, ${ingresosFail} no encontradas`);

  // ---- EGRESOS FORMAS DE PAGO ----
  const shEFP = wb.Sheets['EGRESOS FORMAS DE PAGO'];
  const efpData = xlsx.utils.sheet_to_json(shEFP, { header: 1 });

  let egresosOk = 0, egresosFail = 0;
  // Los egresos empiezan desde fila 4 (índice 4) según estructura detectada
  for (let i = 4; i < efpData.length; i++) {
    const row = efpData[i];
    if (!row || !row[1]) continue;

    const recibo = String(row[1]).trim();
    if (!recibo.startsWith('E')) continue; // Solo recibos de egreso

    const tipo_pago = String(row[3] || 'Efectivo').trim();
    const referencia = String(row[4] || '').trim();
    const banco = String(row[5] || '').trim();
    const monto_bs = Number(row[8]) || Number(row[6]) || 0;
    const tasa = row[7] ? Number(row[7]) : null;
    const monto_usd = tasa && tasa > 0 ? monto_bs / tasa : null;

    let tipo_normalizado = tipo_pago;
    if (tipo_pago.includes('EFECTIVO') || tipo_pago.includes('Efectivo')) tipo_normalizado = 'Efectivo';
    else if (tipo_pago.includes('TRANSFER') || tipo_pago.includes('Transfer')) tipo_normalizado = 'Transferencia';
    else if (tipo_pago.includes('MOVIL') || tipo_pago.includes('Movil') || tipo_pago.includes('MÓVIL')) tipo_normalizado = 'Pago Móvil';
    else if (tipo_pago.includes('CANJE') || tipo_pago.includes('Canje')) tipo_normalizado = 'Canje';

    const transaccionId = await getTransaccionId(recibo);
    if (!transaccionId) {
      egresosFail++;
      continue;
    }

    try {
      await client.execute({
        sql: 'INSERT INTO FormaPago (transaccionId, tipo_pago, referencia, banco, monto_bs, tasa_cambio, monto_usd) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [transaccionId, tipo_normalizado, referencia, banco, monto_bs, tasa, monto_usd]
      });
      egresosOk++;
    } catch (e) {
      egresosFail++;
    }
  }
  console.log(`✅ Formas de Pago EGRESOS: ${egresosOk} migradas, ${egresosFail} no encontradas`);

  // Verificación final
  const r = await client.execute('SELECT COUNT(*) as total FROM FormaPago');
  console.log(`\n🎯 TOTAL FormaPago en Turso: ${r.rows[0].total}`);
  console.log('✅ Migración completada exitosamente');
}

main().catch(e => {
  console.error('ERROR CRÍTICO:', e.message);
  process.exit(1);
});
