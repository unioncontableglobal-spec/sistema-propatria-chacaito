import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

// Cargar .env.local para usar TURSO_DATABASE_URL
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  console.log("Iniciando auditoría de tasas de cambio con libSQL...");
  
  const client = createClient({
    url: process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  const res = await client.execute(`SELECT * FROM Transaccion`);
  const transacciones = res.rows;
  
  // Opcional: leer FormaPago para auditar
  const resFp = await client.execute(`SELECT * FROM FormaPago`);
  const formasPago = resFp.rows;

  const total = transacciones.length;
  let conTasaCambio = 0;
  let conMontoUsd = 0;
  let discrepancias = 0;
  let tasaNulaOBcero = 0;
  let maxTasa = 0;
  let minTasa = 999999;
  
  const tasasPorMes = {};
  let errorEnFormasDePago = 0;

  transacciones.forEach(t => {
    const tasa = typeof t.tasa_cambio === 'number' ? t.tasa_cambio : parseFloat(t.tasa_cambio) || 0;
    const montoBs = typeof t.monto_bs === 'number' ? t.monto_bs : parseFloat(t.monto_bs) || 0;
    const montoUsd = typeof t.monto_usd === 'number' ? t.monto_usd : parseFloat(t.monto_usd) || 0;

    if (tasa > 0) {
      conTasaCambio++;
      if (tasa > maxTasa) maxTasa = tasa;
      if (tasa < minTasa) minTasa = tasa;
      
      const mes = t.mes || 'SIN_MES';
      if (!tasasPorMes[mes]) tasasPorMes[mes] = { sum: 0, count: 0 };
      tasasPorMes[mes].sum += tasa;
      tasasPorMes[mes].count++;
    } else {
      tasaNulaOBcero++;
    }

    if (montoUsd > 0) conMontoUsd++;

    // Verificar matemáticas: monto_bs = monto_usd * tasa_cambio (margen de error pequeño)
    if (montoUsd > 0 && tasa > 0) {
      const esperadoBs = montoUsd * tasa;
      const diferencia = Math.abs(montoBs - esperadoBs);
      if (diferencia > 1) {
        discrepancias++;
      }
    }
    
    // Auditar Formas de Pago vinculadas a esta transaccion
    const fp = formasPago.filter(f => f.transaccionId === t.id);
    if (fp.length > 0) {
      let sumaBsFP = 0;
      fp.forEach(f => {
        const montoFP = typeof f.monto_bs === 'number' ? f.monto_bs : parseFloat(f.monto_bs) || 0;
        sumaBsFP += montoFP;
      });
      if (Math.abs(sumaBsFP - montoBs) > 1) {
        errorEnFormasDePago++;
      }
    }
  });

  const report = {
    totalTransacciones: total,
    transaccionesConTasa: conTasaCambio,
    transaccionesSinTasa: tasaNulaOBcero,
    transaccionesConUSDCalc: conMontoUsd,
    discrepanciasMatematicas: discrepancias,
    errorSumaFormasDePagoVsTotal: errorEnFormasDePago,
    rangoTasas: { min: minTasa === 999999 ? 0 : minTasa, max: maxTasa },
    promedioPorMes: Object.fromEntries(
      Object.entries(tasasPorMes).map(([mes, data]) => [mes, parseFloat((data.sum / data.count).toFixed(2))])
    )
  };

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
