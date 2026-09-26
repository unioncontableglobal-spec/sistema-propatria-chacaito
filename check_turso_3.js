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

  console.log("Fetching all transactions without include...");
  const t = Date.now();
  try {
    const transacciones = await prisma.transaccion.findMany({
      orderBy: { fecha: 'asc' }
    });
    console.log(`Success! Fetched ${transacciones.length} rows in ${Date.now() - t}ms`);
  } catch (err) {
    console.error("Failed to fetch all transactions:", err);
  }

  await prisma.$disconnect();
}

check().catch(console.error);
