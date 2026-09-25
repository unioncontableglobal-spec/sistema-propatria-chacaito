const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@libsql/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
require('dotenv').config();

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const libsql = createClient({ url, authToken });
  const adapter = new PrismaLibSQL(libsql);
  const prisma = new PrismaClient({ adapter });

  const egresos = await prisma.transaccion.findMany({
    where: { tipo: 'EGRESO', mes: 'ENERO', monto_bs: { gt: 0 } },
    include: { formas_pago: true },
    take: 2
  });
  console.log(JSON.stringify(egresos, null, 2));
}
main();
