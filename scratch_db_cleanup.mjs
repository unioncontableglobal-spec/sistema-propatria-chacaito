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

  console.log("Iniciando saneamiento automático de la base de datos...");

  // 1. Borrar Formas de Pago fantasmas (montos en 0 o negativos)
  const resFP = await client.execute(`DELETE FROM FormaPago WHERE monto_bs <= 0 AND monto_usd <= 0`);
  console.log(`✅ Se eliminaron ${resFP.rowsAffected} formas de pago fantasmas (monto cero).`);

  // 2. Corregir Clasificaciones Vacías
  const resClasificacion = await client.execute(`UPDATE Transaccion SET clasificacion = 'OTROS' WHERE clasificacion IS NULL OR clasificacion = ''`);
  console.log(`✅ Se corrigieron ${resClasificacion.rowsAffected} transacciones sin clasificación asignándoles 'OTROS'.`);

  // 3. Corregir Montos Negativos
  // Buscar negativos en bs o usd
  const resTransNeg = await client.execute(`SELECT id, monto_bs, monto_usd FROM Transaccion WHERE monto_bs < 0 OR monto_usd < 0`);
  let fixNegativos = 0;
  for (const row of resTransNeg.rows) {
    const absBs = Math.abs(Number(row.monto_bs));
    const absUsd = Math.abs(Number(row.monto_usd));
    await client.execute({
      sql: `UPDATE Transaccion SET monto_bs = ?, monto_usd = ? WHERE id = ?`,
      args: [absBs, absUsd, row.id]
    });
    fixNegativos++;
  }
  console.log(`✅ Se corrigieron ${fixNegativos} transacciones con montos negativos (convertidos a positivos).`);

  // 4. Reportar sobre los huérfanos sin borrarlos (por seguridad contable)
  const resHuerfanos = await client.execute(`SELECT COUNT(*) as count FROM Transaccion WHERE socioId IS NULL AND terceroId IS NULL`);
  console.log(`⚠️ Existen ${resHuerfanos.rows[0].count} transacciones huérfanas en la base de datos.`);
  console.log(`   (No han sido borradas automáticamente para no alterar los balances financieros sin revisión humana).`);

  console.log("¡Saneamiento completado con éxito!");
}

main().catch(e => { console.error(e); process.exit(1); });
