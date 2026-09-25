import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const asientoId = parseInt(params.id);
    if (isNaN(asientoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Desvincular de la transacción si existe
      await tx.transaccion.updateMany({
        where: { asientoId },
        data: { asientoId: null }
      });

      // 2. Eliminar detalles
      await tx.detalleAsiento.deleteMany({
        where: { asientoId }
      });

      // 3. Eliminar el asiento
      await tx.asientoContable.delete({
        where: { id: asientoId }
      });
    });

    return NextResponse.json({ message: 'Asiento reversado exitosamente' });
  } catch (error: any) {
    console.error('Error al reversar asiento:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}
