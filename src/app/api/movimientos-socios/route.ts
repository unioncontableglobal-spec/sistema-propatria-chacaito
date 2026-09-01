import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const movimientos = await prisma.movimientoSocio.findMany({
      orderBy: { fecha: 'desc' },
      include: {
        socio: {
          select: { nombre_apellido: true, f_afiliacion: true }
        }
      }
    });
    return NextResponse.json({ success: true, data: movimientos });
  } catch (error) {
    console.error('Error fetching movimientos:', error);
    return NextResponse.json({ error: 'Error al obtener movimientos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tipo, socioId, nuevoCupo, detalle, nuevoSocio } = body;

    let socio;
    let fichaActual;
    let cupoActual;

    if (tipo === 'Inscripciones' && nuevoSocio) {
      // Crear nuevo socio
      socio = await prisma.socio.create({
        data: {
          nombre_apellido: nuevoSocio.nombre_apellido,
          cedula: nuevoSocio.cedula || null,
          ficha: nuevoSocio.ficha || null,
          codigo: nuevoCupo,
          status: 'ACTIVO',
          f_afiliacion: new Date()
        }
      });
      fichaActual = socio.ficha;
      cupoActual = socio.codigo;
    } else {
      // Obtener información actual del socio
      socio = await prisma.socio.findUnique({ where: { id: socioId } });
      if (!socio) return NextResponse.json({ error: 'Socio no encontrado' }, { status: 404 });
      fichaActual = socio.ficha;
      cupoActual = socio.codigo;
    }

    // Crear el registro del movimiento
    const movimiento = await prisma.movimientoSocio.create({
      data: {
        tipo,
        ficha: fichaActual,
        cupo: tipo === 'Inscripciones' || tipo === 'Cambios' ? nuevoCupo : cupoActual,
        cupo_anterior: cupoActual,
        nombre_apellido: socio.nombre_apellido,
        f_afiliacion: socio.f_afiliacion,
        detalle,
        socioId: socio.id
      }
    });

    // Aplicar los cambios en el modelo Socio
    if (tipo === 'Retiros') {
      await prisma.socio.update({
        where: { id: socioId },
        data: { 
          status: 'INACTIVO',
          codigo: null // Liberar el cupo
        }
      });
    } else if (tipo === 'Inscripciones' || tipo === 'Cambios') {
      if (!nuevoCupo) return NextResponse.json({ error: 'Se requiere un cupo' }, { status: 400 });
      // Si fue una inscripción y se creó el socio arriba, no necesitamos actualizarlo de nuevo,
      // pero si es un cambio (o inscripción de un socio existente inactivo), lo actualizamos.
      if (!nuevoSocio) {
        await prisma.socio.update({
          where: { id: socio.id },
          data: { 
            codigo: nuevoCupo,
            status: 'ACTIVO' // Asegurar que quede activo
          }
        });
      }
    }

    return NextResponse.json({ success: true, data: movimiento });
  } catch (error) {
    console.error('Error registrando movimiento:', error);
    return NextResponse.json({ error: 'Error al procesar el movimiento' }, { status: 500 });
  }
}
