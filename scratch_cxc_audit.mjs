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

  const res = await client.execute(`SELECT mes, COUNT(*) as count FROM CuentaPorCobrar GROUP BY mes`);
  console.table(res.rows);
}

main().catch(console.error);
