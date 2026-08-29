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

async function runMigration() {
  console.log("Adding numero_ficha to Socio...");
  try {
    await client.execute(`ALTER TABLE "Socio" ADD COLUMN "numero_ficha" TEXT;`);
    console.log("Column numero_ficha added.");
  } catch(e) {
    if (e.message && e.message.includes("duplicate column")) {
      console.log("Column already exists.");
    } else {
      console.error(e);
    }
  }
}

runMigration();
