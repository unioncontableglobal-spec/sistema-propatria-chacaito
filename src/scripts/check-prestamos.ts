import prisma from '../lib/prisma';

async function main() {
  const prestamosEnero = await prisma.transaccion.findMany({
    where: { 
      mes: 'ENERO',
      clasificacion: 'PRESTAMOS'
    }
  });
  console.log('PRESTAMOS ENERO:', prestamosEnero.length);
  const prestamosGeneral = await prisma.transaccion.findMany({
    where: { 
      clasificacion: 'PRESTAMOS'
    },
    select: { mes: true, monto_bs: true }
  });
  console.log('PRESTAMOS TODOS:', prestamosGeneral);
}
main().catch(console.error).finally(() => prisma.$disconnect());
