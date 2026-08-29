import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando migración de historial inicial...");

  const socios = await prisma.socio.findMany({
    where: {
      codigo: { not: null }
    }
  });

  console.log(`Encontrados ${socios.length} socios con cupo asignado.`);

  let insertados = 0;
  for (const socio of socios) {
    // Check if a movement already exists for this socio to prevent duplicates
    const exists = await prisma.movimientoSocio.findFirst({
      where: { socio_id: socio.id }
    });

    if (!exists) {
      await prisma.movimientoSocio.create({
        data: {
          socio_id: socio.id,
          tipo: 'Inscripciones',
          cupo: socio.codigo,
          detalle: `Registro inicial del sistema (Migración de data histórica)`,
          fecha: new Date(),
        }
      });
      insertados++;
    }
  }

  console.log(`Migración completada. ${insertados} movimientos generados.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
