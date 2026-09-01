import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const libsql = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  const result = await libsql.execute('SELECT count(*) as count FROM Socio WHERE codigo IS NOT NULL');
  console.log("Total Socios con codigo:", result.rows[0].count);
}
main().catch(console.error);
