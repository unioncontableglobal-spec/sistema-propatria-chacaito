import prisma from '../lib/prisma';

async function main() {
  console.log('Starting historical CxC hydration...');

  const publicaciones = await prisma.publicacionMensual.findMany({
    where: { estado: 'APROBADO' }
  });

  const sociosActivos = await prisma.socio.findMany({
    where: { status: 'ACTIVO' }
  });

  const sociosSACount = sociosActivos.filter((s: any) => s.ficha?.toUpperCase().startsWith('SA')).length;

  for (const pub of publicaciones) {
    console.log(`Processing month: ${pub.mes}`);
    
    // Convert 01-2026 to ENERO / Enero for Transaccion lookup
    const mesMap: Record<string, string[]> = {
      '01-2026': ['ENERO', 'Enero'],
      '02-2026': ['FEBRERO', 'Febrero'],
      '03-2026': ['MARZO', 'Marzo'],
      '04-2026': ['ABRIL', 'Abril']
    };
    
    const possibleMeses = mesMap[pub.mes] || [pub.mes];

    // Find who already paid
    const pagos = await prisma.transaccion.findMany({
      where: { mes: { in: possibleMeses }, tipo: 'INGRESO' }
    });
    const pagosSocioIds = new Set(pagos.filter(p => p.socioId).map(p => p.socioId));
    console.log(`Found ${pagosSocioIds.size} socios who already paid in ${pub.mes}`);

    // Clean existing CxC for this month to avoid duplicates
    await prisma.cuentaPorCobrar.deleteMany({
      where: { mes: pub.mes }
    });

    const reglas = JSON.parse(pub.reglas_json || '{}');
    const cuotaFinanzas = reglas.finanzas || 35;
    const perCapitaFijos = reglas.perCapita || {};
    
    const eventos = reglas.eventos || [];
    const eventosAgrupados = eventos.reduce((acc: any, ev: any) => {
      if (!acc[ev.tipo]) acc[ev.tipo] = 0;
      acc[ev.tipo] += (parseFloat(ev.montoTotal) || 0);
      return acc;
    }, {});

    const cxcInserts: any[] = [];

    sociosActivos.forEach((socio: any) => {
      const isSB = socio.ficha?.toUpperCase().startsWith('SB');
      const estado = pagosSocioIds.has(socio.id) ? 'PAGADA' : 'PENDIENTE';

      // Finanzas
      cxcInserts.push({
        socioId: socio.id,
        tipo_publicacion: 'FINANZAS',
        mes: pub.mes,
        monto_a_cobrar: cuotaFinanzas,
        estado
      });

      // Eventos
      Object.keys(eventosAgrupados).forEach(tipo => {
        const isGrua = tipo.toUpperCase().includes('GRUA');
        
        if (isGrua && isSB) {
          return; // SB no pagan grúa
        }

        let divisor = isGrua ? sociosSACount : sociosActivos.length;
        let costo = divisor > 0 ? eventosAgrupados[tipo] / divisor : 0;
        
        if (tipo.toUpperCase().includes('VIDRIO') && perCapitaFijos.vidrios !== undefined) costo = perCapitaFijos.vidrios;
        if (tipo.toUpperCase().includes('MONTEPIO') && perCapitaFijos.montepio !== undefined) costo = perCapitaFijos.montepio;
        if (isGrua && perCapitaFijos.grua !== undefined) costo = perCapitaFijos.grua;
        if (tipo.toUpperCase().includes('AYUDA') && perCapitaFijos.ayudas !== undefined) costo = perCapitaFijos.ayudas;
        
        cxcInserts.push({
          socioId: socio.id,
          tipo_publicacion: tipo,
          mes: pub.mes,
          monto_a_cobrar: costo,
          estado
        });
      });
    });

    const chunkSize = 500;
    for (let i = 0; i < cxcInserts.length; i += chunkSize) {
      const chunk = cxcInserts.slice(i, i + chunkSize);
      await prisma.cuentaPorCobrar.createMany({ data: chunk });
    }
    
    console.log(`Inserted ${cxcInserts.length} CxC records for ${pub.mes}`);
  }

  console.log('Hydration complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
