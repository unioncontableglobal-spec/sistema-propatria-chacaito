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

  const c1 = await prisma.transaccion.count({ where: { mes: { in: ['ENERO', '01-2026'] }, tipo: 'INGRESO', monto_bs: { gt: 0 } } });
  const c2 = await prisma.transaccion.count({ where: { mes: { in: ['ENERO', '01-2026'] }, tipo: 'INGRESO' } });
  
  console.log("INGRESO PARA ENERO (con monto_bs > 0):", c1);
  console.log("INGRESO PARA ENERO (SIN restriccion):", c2);
  
  const c3 = await prisma.transaccion.count({ where: { mes: { in: ['ENERO', '01-2026'] }, tipo: 'EGRESO', monto_bs: { gt: 0 } } });
  const c4 = await prisma.transaccion.count({ where: { mes: { in: ['ENERO', '01-2026'] }, tipo: 'EGRESO' } });

  console.log("EGRESO PARA ENERO (con monto_bs > 0):", c3);
  console.log("EGRESO PARA ENERO (SIN restriccion):", c4);
}
main();
