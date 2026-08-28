import prisma from '../lib/prisma';

async function main() {
  const ingresos = await prisma.transaccion.groupBy({
    by: ['clasificacion'],
    where: { tipo: 'INGRESO' },
    _sum: { monto_bs: true, monto_usd: true }
  });
  console.log('--- CLASIFICACIONES DE INGRESO ---');
  console.log(ingresos);

  const egresos = await prisma.transaccion.groupBy({
    by: ['clasificacion'],
    where: { tipo: 'EGRESO' },
    _sum: { monto_bs: true, monto_usd: true }
  });
  console.log('\n--- CLASIFICACIONES DE EGRESO ---');
  console.log(egresos);
}
main().catch(console.error).finally(() => prisma.$disconnect());
