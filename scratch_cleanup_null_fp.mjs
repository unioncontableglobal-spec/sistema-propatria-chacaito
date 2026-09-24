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

  const res = await client.execute(`DELETE FROM FormaPago WHERE (monto_bs <= 0 OR monto_bs IS NULL) AND (monto_usd <= 0 OR monto_usd IS NULL)`);
  console.log(`Borradas ${res.rowsAffected} formas de pago nulas.`);
}

main().catch(e => { console.error(e); process.exit(1); });
