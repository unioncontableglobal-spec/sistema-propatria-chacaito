import { createClient } from '@libsql/client';
import fs from 'fs';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Faltan credenciales de Turso en .env");
  process.exit(1);
}

const client = createClient({
  url,
  authToken,
});

async function main() {
  console.log("Conectando a Turso...");
  const sql = fs.readFileSync('dump.sql', 'utf8');
  
  console.log("Ejecutando volcado de base de datos local en la nube (esto puede tardar unos segundos)...");
  
  try {
    await client.executeMultiple(sql);
    console.log("¡Migración a Turso completada exitosamente!");
  } catch (error) {
    console.error("Error migrando a Turso:", error);
  }
}

main();
