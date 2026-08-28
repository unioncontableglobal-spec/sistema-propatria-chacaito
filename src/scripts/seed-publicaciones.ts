import prisma from '../lib/prisma';

async function main() {
  console.log('Sincronizando registros maestros de Publicaciones Mensuales...');

  const publicaciones = [
    {
      mes: '01-2026',
      estado: 'APROBADO',
      reglas_json: JSON.stringify({
        finanzas: 35,
        perCapita: { vidrios: 0.48, montepio: 9, grua: 0, ayudas: 0 },
        eventos: []
      })
    },
    {
      mes: '02-2026',
      estado: 'APROBADO',
      reglas_json: JSON.stringify({
        finanzas: 35,
        perCapita: { vidrios: 0.32, montepio: 3, grua: 0, ayudas: 0 },
        eventos: []
      })
    },
    {
      mes: '03-2026',
      estado: 'APROBADO',
      reglas_json: JSON.stringify({
        finanzas: 35,
        perCapita: { vidrios: 0.20, montepio: 0, grua: 0, ayudas: 0 },
        eventos: []
      })
    }
  ];

  for (const pub of publicaciones) {
    await prisma.publicacionMensual.upsert({
      where: { mes: pub.mes },
      update: {
        estado: pub.estado,
        reglas_json: pub.reglas_json
      },
      create: {
        mes: pub.mes,
        estado: pub.estado,
        reglas_json: pub.reglas_json,
        fecha_pub: new Date()
      }
    });
    console.log(`✅ Publicación ${pub.mes} sincronizada y bloqueada.`);
  }

  console.log('¡Listo! Histórico de Publicaciones sincronizado correctamente.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
