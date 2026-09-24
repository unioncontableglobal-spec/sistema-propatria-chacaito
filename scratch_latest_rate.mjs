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

  // Buscar la tasa más reciente que sea "realista" (ej. entre 35 y 55 Bs)
  const res = await client.execute(`
    SELECT id, fecha, mes, tasa_cambio 
    FROM Transaccion 
    WHERE tasa_cambio >= 35 AND tasa_cambio <= 55 
    ORDER BY fecha DESC, id DESC 
    LIMIT 5
  `);
  
  console.table(res.rows);
}

main().catch(console.error);
