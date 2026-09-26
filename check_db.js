
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const allTransacciones = await prisma.transaccion.findMany({
    select: { id: true, fecha: true, recibo: true, tipo: true },
    orderBy: { fecha: 'asc' }
  });
  
  console.log(`Total de transacciones: ${allTransacciones.length}`);
  if (allTransacciones.length > 0) {
    console.log("Primeras 5 transacciones:");
    console.table(allTransacciones.slice(0, 5));
    console.log("Últimas 5 transacciones:");
    console.table(allTransacciones.slice(-5));
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
