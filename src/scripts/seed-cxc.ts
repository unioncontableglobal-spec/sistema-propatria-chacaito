import prisma from '../lib/prisma';

const MESES = ['ENERO', 'FEBRERO', 'MARZO'];

const TARIFAS = {
  'ENERO': [
    { tipo: 'FIANZA', monto: 35 },
    { tipo: 'VIDRIO', monto: 0.48 },
    { tipo: 'MONTEPIO', monto: 9 }
  ],
  'FEBRERO': [
    { tipo: 'FIANZA', monto: 35 },
    { tipo: 'VIDRIO', monto: 0.32 },
    { tipo: 'MONTEPIO', monto: 3 }
  ],
  'MARZO': [
    { tipo: 'FIANZA', monto: 35 },
    { tipo: 'VIDRIO', monto: 0.20 }
  ]
};

async function main() {
  console.log('Iniciando reconstrucción de Cuentas por Cobrar (CxC) histórica...');

  // Limpiar CxC existente
  await prisma.cuentaPorCobrar.deleteMany({});
  console.log('CxC limpiada.');

  // Obtener todos los socios activos
  const socios = await prisma.socio.findMany({
    where: { status: 'ACTIVO' }
  });
  console.log(`Socios Activos encontrados: ${socios.length}`);

  // Obtener transacciones de ingreso del trimestre
  const transacciones = await prisma.transaccion.findMany({
    where: {
      tipo: 'INGRESO',
      mes: { in: MESES }
    },
    select: { socioId: true, mes: true }
  });
  
  // Crear un Set para buscar rápido quién pagó qué mes: "socioId-MES"
  const pagosSet = new Set<string>();
  transacciones.forEach(tx => {
    if (tx.socioId && tx.mes) {
      pagosSet.add(`${tx.socioId}-${tx.mes.toUpperCase()}`);
    }
  });

  const cxcPayload = [];

  for (const socio of socios) {
    for (const mes of MESES) {
      const key = `${socio.id}-${mes}`;
      
      // Si NO pagó en ese mes, se le genera la deuda
      if (!pagosSet.has(key)) {
        const conceptos = TARIFAS[mes as keyof typeof TARIFAS];
        for (const concepto of conceptos) {
          cxcPayload.push({
            socioId: socio.id,
            tipo_publicacion: concepto.tipo,
            mes: mes,
            monto_a_cobrar: concepto.monto,
            estado: 'PENDIENTE'
          });
        }
      }
    }
  }

  console.log(`Se generarán ${cxcPayload.length} registros individuales de CxC por descarte.`);
  
  // Insertar en la BD en chunks
  const chunkSize = 500;
  for (let i = 0; i < cxcPayload.length; i += chunkSize) {
    const chunk = cxcPayload.slice(i, i + chunkSize);
    await prisma.cuentaPorCobrar.createMany({ data: chunk });
  }

  console.log('Reconstrucción de CxC completada exitosamente.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
