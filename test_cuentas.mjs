import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const libsql = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  const result = await libsql.execute('SELECT * FROM CuentaContable LIMIT 5');
  console.log("Cuentas:", result.rows);
}
main().catch(console.error);
