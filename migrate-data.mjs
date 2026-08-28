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
  const sql = fs.readFileSync('full_dump.sql', 'utf8');
  
  // We can just execute the full dump directly
  console.log("Ejecutando volcado completo de base de datos local (schema + datos) en la nube...");
  
  try {
    await client.executeMultiple(sql);
    console.log("¡Migración de datos a Turso completada exitosamente!");
  } catch (error) {
    console.error("Error migrando a Turso:", error);
  }
}

main();
