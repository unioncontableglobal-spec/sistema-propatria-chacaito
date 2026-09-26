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
  const libsql = createClient({ url, authToken });
  const adapter = new PrismaLibSQL(libsql);
  const prisma = new PrismaClient({ adapter });

  try {
    const t = await prisma.transaccion.findFirst({
      where: { recibo: "I202600001" },
      include: { formas_pago: true }
    });
    console.log(JSON.stringify(t.formas_pago, null, 2));
  } catch (err) {
    console.error(err);
  }
  await prisma.$disconnect();
}
check().catch(console.error);
