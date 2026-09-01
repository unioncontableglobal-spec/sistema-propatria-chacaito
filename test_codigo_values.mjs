import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const libsql = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  const result = await libsql.execute('SELECT codigo, count(*) as count FROM Socio GROUP BY codigo LIMIT 10');
  console.log("Valores codigo:", result.rows);
}
main().catch(console.error);
