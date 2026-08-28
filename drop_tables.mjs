import { createClient } from '@libsql/client';

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
  const tables = [
    'DetalleAsiento',
    'AsientoContable',
    'Conciliacion',
    'CuentaContable',
    'CuentaPorCobrar',
    'CuentaPorPagar',
    'FormaPago',
    'ParametroLegal',
    'PublicacionMensual',
    'Transaccion',
    'Socio',
    '_prisma_migrations',
    'sqlite_sequence'
  ];

  console.log("Dropping existing tables in Turso...");
  
  for (const table of tables) {
    try {
      await client.execute(`DROP TABLE IF EXISTS "${table}"`);
      console.log(`Dropped ${table}`);
    } catch (e) {
      console.log(`Failed to drop ${table}: ${e.message}`);
    }
  }
  
  console.log("All tables dropped!");
}

main();
