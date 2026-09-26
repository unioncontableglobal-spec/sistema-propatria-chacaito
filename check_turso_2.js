const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@libsql/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');

require('dotenv').config({ path: '.env.local' });
if (!process.env.TURSO_DATABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

async function check() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error("No se encontró TURSO_DATABASE_URL");
    return;
  }

  const libsql = createClient({ url, authToken });
  const adapter = new PrismaLibSQL(libsql);
  const prisma = new PrismaClient({ adapter });

  const tCount = await prisma.transaccion.count();
  const aCount = await prisma.asientoContable.count();
  console.log(`Turso tiene: ${tCount} transacciones y ${aCount} asientos contables.`);
  
  if (tCount > 0) {
    const dates = await prisma.$queryRaw`SELECT substr(fecha, 1, 7) as mes, count(*) as count FROM Transaccion GROUP BY mes`;
    console.log("Fechas de transacciones en Turso:", dates);
  }

  await prisma.$disconnect();
}

check().catch(console.error);
