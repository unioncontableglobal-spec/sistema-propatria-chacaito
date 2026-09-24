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

  // Query all transactions to do analytical grouping of exchange rates
  const res = await client.execute(`SELECT id, mes, monto_bs, monto_usd, tasa_cambio FROM Transaccion WHERE tasa_cambio > 0 AND monto_usd > 0`);
  
  const ratesCount = {};
  let totalValid = 0;

  for (const row of res.rows) {
    const tasa = Number(row.tasa_cambio);
    const usd = Number(row.monto_usd);
    const bs = Number(row.monto_bs);

    // Exclude "Efecto 1 USD" where usd == 1 and tasa == bs
    if (usd === 1 && Math.abs(tasa - bs) < 1) continue;
    // Exclude if tasa is exactly 1 (meaning 1 to 1, usually an error for Bs to USD)
    if (tasa === 1) continue;

    // We can also check if bs / usd approximately equals tasa
    const calcTasa = bs / usd;
    if (Math.abs(calcTasa - tasa) > 5) {
      // mathematically incoherent row, skip
      continue;
    }

    ratesCount[tasa] = (ratesCount[tasa] || 0) + 1;
    totalValid++;
  }

  const sortedRates = Object.entries(ratesCount)
    .map(([tasa, count]) => ({ tasa: Number(tasa), count }))
    .sort((a, b) => b.count - a.count);

  console.log(`Total de tasas válidas y matemáticamente coherentes: ${totalValid}`);
  console.log("Top 10 Tasas de Cambio más usadas en la base de datos:");
  console.table(sortedRates.slice(0, 10));

  // Let's also check the average rate per month for the valid ones
  const ratesByMonth = {};
  for (const row of res.rows) {
    const tasa = Number(row.tasa_cambio);
    const usd = Number(row.monto_usd);
    const bs = Number(row.monto_bs);

    if (usd === 1 && Math.abs(tasa - bs) < 1) continue;
    if (tasa === 1) continue;
    const calcTasa = bs / usd;
    if (Math.abs(calcTasa - tasa) > 5) continue;

    const mes = row.mes || 'SIN MES';
    if (!ratesByMonth[mes]) ratesByMonth[mes] = { sum: 0, count: 0 };
    ratesByMonth[mes].sum += tasa;
    ratesByMonth[mes].count++;
  }

  console.log("\nPromedio de Tasa de Cambio por Mes (Datos limpios):");
  const monthAvgs = Object.entries(ratesByMonth).map(([mes, data]) => ({
    mes, 
    promedio: (data.sum / data.count).toFixed(2),
    operaciones: data.count
  }));
  console.table(monthAvgs);
}

main().catch(console.error);
