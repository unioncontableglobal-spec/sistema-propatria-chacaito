import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params;
    const movimientoId = parseInt(p.id);

    const movimiento = await prisma.movimientoSocio.findUnique({
      where: { id: movimientoId },
      include: { socio: true }
    });

    if (!movimiento) {
      return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 });
    }

    if (movimiento.detalle?.includes('[ANULADO]')) {
      return NextResponse.json({ error: 'El movimiento ya se encuentra anulado' }, { status: 400 });
    }

    const { tipo, socioId, cupo, cupo_anterior } = movimiento;

    // Ejecutar lógica de reversión
    if (tipo === 'Inscripciones') {
      // Revertir inscripción: poner estatus INACTIVO y liberar el cupo
      if (socioId) {
        await prisma.socio.update({
          where: { id: socioId },
          data: {
            status: 'INACTIVO',
            codigo: null
          }
        });
      }
    } else if (tipo === 'Retiros') {
      // Revertir retiro: restaurar cupo y poner ACTIVO
      if (socioId && cupo) {
        // Verificar que el cupo no esté siendo usado por otro socio
        const cupoOcupado = await prisma.socio.findFirst({
          where: { codigo: cupo, status: 'ACTIVO', id: { not: socioId } }
        });
        
        if (cupoOcupado) {
          return NextResponse.json({ error: `El cupo ${cupo} ya fue ocupado por el socio ${cupoOcupado.nombre_apellido}` }, { status: 400 });
        }

        await prisma.socio.update({
          where: { id: socioId },
          data: {
            status: 'ACTIVO',
            codigo: cupo
          }
        });
      }
    } else if (tipo === 'Cambios') {
      // Revertir cambio: devolver al cupo_anterior
      if (socioId && cupo_anterior) {
        // Verificar que el cupo anterior esté libre
        const cupoAnteriorOcupado = await prisma.socio.findFirst({
          where: { codigo: cupo_anterior, status: 'ACTIVO', id: { not: socioId } }
        });
        
        if (cupoAnteriorOcupado) {
          return NextResponse.json({ error: `El cupo anterior ${cupo_anterior} ya fue ocupado por ${cupoAnteriorOcupado.nombre_apellido}` }, { status: 400 });
        }

        await prisma.socio.update({
          where: { id: socioId },
          data: {
            status: 'ACTIVO',
            codigo: cupo_anterior
          }
        });
      } else {
         return NextResponse.json({ error: 'No se dispone del cupo anterior en el registro para revertir este cambio. (Posiblemente sea un registro antiguo)' }, { status: 400 });
      }
    }

    // Marcar movimiento como anulado
    await prisma.movimientoSocio.update({
      where: { id: movimientoId },
      data: {
        detalle: `[ANULADO] ${movimiento.detalle || ''}`
      }
    });

    return NextResponse.json({ success: true, message: 'Movimiento anulado exitosamente' });
  } catch (error: any) {
    console.error('Error anulando movimiento:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
