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

  const data = await prisma.transaccion.findMany({
    where: {
      mes: { in: ['ENERO', '01-2026'] },
      tipo: 'INGRESO',
      monto_bs: { gt: 0 }
    },
    take: 10
  });
  console.log("INGRESO PARA ENERO:", data.length);
  
  const allEnro = await prisma.transaccion.count({
    where: { mes: 'ENERO' }
  });
  console.log("ALL ENERO:", allEnro);
}
main();
