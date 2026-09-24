import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  const report = {};

  console.log("Auditing Socios...");
  const resSocios = await client.execute(`SELECT * FROM Socio`);
  const socios = resSocios.rows;
  report.socios = {
    total: socios.length,
    sinFicha: socios.filter(s => !s.ficha || s.ficha.trim() === '').length,
    sinCedula: socios.filter(s => !s.cedula || s.cedula.trim() === '').length,
    fichasDuplicadas: 0,
    nombresSospechosos: socios.filter(s => !s.nombre_apellido || s.nombre_apellido.length < 3).length,
  };
  
  const fichasMap = {};
  socios.forEach(s => {
    if (s.ficha) {
      fichasMap[s.ficha] = (fichasMap[s.ficha] || 0) + 1;
      if (fichasMap[s.ficha] === 2) report.socios.fichasDuplicadas++;
    }
  });

  console.log("Auditing Transacciones...");
  const resTrans = await client.execute(`SELECT * FROM Transaccion`);
  const trans = resTrans.rows;
  report.transacciones = {
    total: trans.length,
    huerfanas: trans.filter(t => !t.socioId && !t.terceroId).length,
    ingresosSinRecibo: trans.filter(t => t.tipo === 'INGRESO' && (!t.recibo || t.recibo.trim() === '')).length,
    // Egresos usually don't have recibo, maybe comprobante, skip this check
    fechasFuturas: trans.filter(t => new Date(t.fecha) > new Date()).length,
    montosNegativos: trans.filter(t => (t.monto_bs !== null && t.monto_bs < 0) || (t.monto_usd !== null && t.monto_usd < 0)).length,
    clasificacionVacia: trans.filter(t => !t.clasificacion || t.clasificacion.trim() === '').length,
    sinMes: trans.filter(t => !t.mes || t.mes.trim() === '').length
  };

  console.log("Auditing Formas de Pago...");
  const resFP = await client.execute(`SELECT * FROM FormaPago`);
  const formasPago = resFP.rows;
  report.formasPago = {
    total: formasPago.length,
    huerfanas: formasPago.filter(f => !f.transaccionId).length,
    montosCeroONegativos: formasPago.filter(f => f.monto_bs <= 0 && f.monto_usd <= 0).length,
  };

  console.log("Auditing CxC...");
  const resCxC = await client.execute(`SELECT * FROM CuentaPorCobrar`);
  const cxc = resCxC.rows;
  report.cxc = {
    total: cxc.length,
    huerfanas: cxc.filter(c => !c.socioId).length,
    montosNegativos: cxc.filter(c => c.ayudas_bs < 0 || c.fianzas_usd < 0 || c.vidrios_usd < 0 || c.montepio_usd < 0 || c.grua_usd < 0).length,
  };

  console.log(JSON.stringify(report, null, 2));

  if (report.socios.fichasDuplicadas > 0) {
    console.log("\nFichas Duplicadas:");
    for (const [ficha, count] of Object.entries(fichasMap)) {
      if (count > 1) {
        console.log(`Ficha ${ficha}: ${count} veces`);
      }
    }
  }

  // Duplicate receipt numbers for ingresos?
  const recibos = trans.filter(t => t.tipo === 'INGRESO' && t.recibo);
  const recibosMap = {};
  let recibosDuplicados = 0;
  recibos.forEach(r => {
    recibosMap[r.recibo] = (recibosMap[r.recibo] || 0) + 1;
    if (recibosMap[r.recibo] === 2) recibosDuplicados++;
  });
  console.log(`\nRecibos de Ingreso Duplicados: ${recibosDuplicados}`);
  if (recibosDuplicados > 0) {
    for (const [recibo, count] of Object.entries(recibosMap)) {
      if (count > 1) {
        console.log(`Recibo ${recibo}: ${count} veces`);
      }
    }
  }

}

main().catch(e => { console.error(e); process.exit(1); });
