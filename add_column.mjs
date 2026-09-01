import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const libsql = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  await libsql.execute('ALTER TABLE MovimientoSocio ADD COLUMN cupo_anterior TEXT;');
  console.log("Column added");
}
main().catch(console.error);
