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

  const res = await client.execute(`SELECT id, mes, tipo, monto_bs, monto_usd, tasa_cambio, clasificacion FROM Transaccion WHERE tasa_cambio > 50 ORDER BY tasa_cambio DESC LIMIT 10`);
  
  console.log("Top 10 transacciones con Tasa de Cambio ABSURDA (> 50):");
  console.table(res.rows);

  const resZero = await client.execute(`SELECT COUNT(*) as count FROM Transaccion WHERE tasa_cambio = 0 OR tasa_cambio IS NULL`);
  console.log("Transacciones sin tasa:", resZero.rows[0].count);
  
  const resDiscrepancy = await client.execute(`SELECT id, mes, monto_bs, monto_usd, tasa_cambio, clasificacion FROM Transaccion WHERE monto_usd > 0 AND tasa_cambio > 0 AND ABS(monto_bs - (monto_usd * tasa_cambio)) > 1 LIMIT 5`);
  console.log("\nEjemplo de 5 Discrepancias Matemáticas (monto_bs != monto_usd * tasa):");
  console.table(resDiscrepancy.rows);
}

main().catch(e => { console.error(e); process.exit(1); });
