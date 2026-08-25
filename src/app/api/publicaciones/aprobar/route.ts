import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { mes, cuotaFinanzas, eventos, perCapitaFijos } = data;

    // Verificar si el mes ya está aprobado
    const existente = await prisma.publicacionMensual.findUnique({
      where: { mes }
    });

    if (existente && existente.estado === 'APROBADO') {
      return NextResponse.json({ error: 'El mes ya fue procesado y está bloqueado' }, { status: 400 });
    }

    // Buscar todos los socios activos
    const sociosActivos = await prisma.socio.findMany({
      where: { status: 'ACTIVO' }
    });

    if (sociosActivos.length === 0) {
      return NextResponse.json({ error: 'No hay socios activos para cargar deudas' }, { status: 400 });
    }

    // Calcular costos per-capita
    const reglas: any = {
      finanzas: cuotaFinanzas,
      eventos: []
    };

    // Usar una transacción para asegurar que todo o nada se guarda
    await prisma.$transaction(async (tx) => {
      // 1. Guardar/Actualizar la publicación como APROBADA
      for (const evento of eventos) {
        reglas.eventos.push({
          tipo: evento.tipo,
          montoTotal: evento.monto,
          costoPorSocio: 0 // Se calcula agrupado más abajo o se toma fijo
        });

        // 2. Crear Cuentas Por Pagar al beneficiario
        if (evento.socioBeneficiarioId) {
          await tx.cuentaPorPagar.create({
            data: {
              socioId: evento.socioBeneficiarioId,
              tipo_publicacion: evento.tipo,
              parentesco: evento.parentesco,
              mes: mes,
              monto: evento.monto,
              estado: 'PENDIENTE'
            }
          });
        }
      }

      // Agrupar eventos para calcular CxC único por tipo
      const eventosAgrupados = eventos.reduce((acc: any, ev: any) => {
        if (!acc[ev.tipo]) acc[ev.tipo] = 0;
        acc[ev.tipo] += ev.monto;
        return acc;
      }, {});
      
      if (perCapitaFijos) {
        reglas.perCapita = perCapitaFijos;
      }

      await tx.publicacionMensual.upsert({
        where: { mes },
        update: {
          estado: 'APROBADO',
          reglas_json: JSON.stringify(reglas),
          fecha_pub: new Date()
        },
        create: {
          mes,
          estado: 'APROBADO',
          reglas_json: JSON.stringify(reglas)
        }
      });

      // 3. Crear Cuentas Por Cobrar masivas para todos los socios
      // Preparamos el array de inserts para que sea más eficiente
      const cxcInserts: any[] = [];
      
      sociosActivos.forEach(socio => {
        // Cuota Finanzas Fija
        cxcInserts.push({
          socioId: socio.id,
          tipo_publicacion: 'FINANZAS',
          mes: mes,
          monto_a_cobrar: cuotaFinanzas,
          estado: 'PENDIENTE'
        });

        // Por cada evento agrupado (Vidrio, Montepio, etc), calcular el per-capita y añadir
        Object.keys(eventosAgrupados).forEach(tipo => {
          let costo = eventosAgrupados[tipo] / sociosActivos.length;
          
          if (perCapitaFijos) {
            if (tipo.toUpperCase().includes('VIDRIO') && perCapitaFijos.vidrios !== undefined) costo = perCapitaFijos.vidrios;
            if (tipo.toUpperCase().includes('MONTEPIO') && perCapitaFijos.montepio !== undefined) costo = perCapitaFijos.montepio;
            if (tipo.toUpperCase().includes('GRUA') && perCapitaFijos.grua !== undefined) costo = perCapitaFijos.grua;
            if (tipo.toUpperCase().includes('AYUDA') && perCapitaFijos.ayudas !== undefined) costo = perCapitaFijos.ayudas;
          }
          
          cxcInserts.push({
            socioId: socio.id,
            tipo_publicacion: tipo,
            mes: mes,
            monto_a_cobrar: costo,
            estado: 'PENDIENTE'
          });
        });
      });

      await tx.cuentaPorCobrar.createMany({
        data: cxcInserts
      });
    });

    return NextResponse.json({ success: true, message: 'Publicación generada y deudas cargadas' });
  } catch (error) {
    console.error('Error aprobando publicacion:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
