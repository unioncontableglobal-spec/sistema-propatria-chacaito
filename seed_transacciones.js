const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.transaccion.create({
    data: {
      tipo: 'INGRESO',
      recibo: '1001',
      fecha: new Date(),
      mes: '2026-08',
      monto_bs: 1500.50,
      clasificacion: 'CUOTA',
      detalle: 'Pago de condominio de prueba'
    }
  });

  await prisma.transaccion.create({
    data: {
      tipo: 'EGRESO',
      recibo: 'E-001',
      fecha: new Date(),
      mes: '2026-08',
      monto_bs: 350.00,
      clasificacion: 'GASTO',
      detalle: 'Compra de papelería de prueba'
    }
  });

  console.log('2 recibos de prueba creados.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
