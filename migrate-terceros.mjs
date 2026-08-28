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
  console.log("Creating Tercero table...");
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "Tercero" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "tipo" TEXT NOT NULL,
        "nombre" TEXT NOT NULL,
        "identificacion" TEXT,
        "telefono" TEXT,
        "direccion" TEXT
      );
    `);
    console.log("Table Tercero created.");
  } catch(e) {
    console.error(e);
  }

  console.log("Adding terceroId to Transaccion...");
  try {
    await client.execute(`ALTER TABLE "Transaccion" ADD COLUMN "terceroId" INTEGER REFERENCES "Tercero"("id") ON DELETE SET NULL ON UPDATE CASCADE;`);
    console.log("Column terceroId added.");
  } catch(e) {
    if (e.message && e.message.includes("duplicate column")) {
      console.log("Column already exists.");
    } else {
      console.error(e);
    }
  }
}

runMigration();
