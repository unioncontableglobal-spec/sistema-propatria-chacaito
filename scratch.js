const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const t = await prisma.transaccion.findMany({ select: { id: true, mes: true, fecha: true }, take: 10, orderBy: { fecha: 'desc' } });
  console.log("TRANSACTION MES VALUES:", t.map(x => x.mes));
}
main().finally(() => prisma.$disconnect());
