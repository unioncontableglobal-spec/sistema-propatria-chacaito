import prisma from '../lib/prisma';

async function main() {
  const ingresos = await prisma.transaccion.findMany({ where: { tipo: 'INGRESO' }, select: { clasificacion: true, monto_bs: true } });
  const egresos = await prisma.transaccion.findMany({ where: { tipo: 'EGRESO' }, select: { clasificacion: true, monto_bs: true } });

  const ingMap = new Map();
  ingresos.forEach(i => {
    ingMap.set(i.clasificacion, (ingMap.get(i.clasificacion) || 0) + i.monto_bs);
  });
  console.log('--- CLASIFICACIONES DE INGRESO ---');
  console.log(Object.fromEntries(ingMap));

  const egMap = new Map();
  egresos.forEach(e => {
    egMap.set(e.clasificacion, (egMap.get(e.clasificacion) || 0) + e.monto_bs);
  });
  console.log('\n--- CLASIFICACIONES DE EGRESO ---');
  console.log(Object.fromEntries(egMap));
}
main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
});
