import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf-8');
const envVars = Object.fromEntries(
  envFile.split('\n').filter(Boolean).map(line => {
    const [key, ...val] = line.split('=');
    return [key, val.join('=').replace(/^"|"$/g, '')];
  })
);

const client = createClient({
  url: envVars.TURSO_DATABASE_URL,
  authToken: envVars.TURSO_AUTH_TOKEN,
});

async function run() {
  const rs = await client.execute(`SELECT id, codigo, ficha, numero_ficha, nombre_apellido, cedula FROM Socio LIMIT 10;`);
  console.log(rs.rows);
}

run();
