import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

async function main() {
  const result = await client.execute('SELECT COUNT(*) as count FROM Socio');
  console.log(`Socios in Turso: ${result.rows[0].count}`);
  
  const tx = await client.execute('SELECT COUNT(*) as count FROM Transaccion');
  console.log(`Transacciones in Turso: ${tx.rows[0].count}`);
}

main();
