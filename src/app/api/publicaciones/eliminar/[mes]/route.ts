import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ mes: string }> }) {
  try {
    const { mes } = await params;

    if (!mes) {
      return NextResponse.json({ error: 'Mes es requerido' }, { status: 400 });
    }

    // Comprobar si hay CxC pagadas
    const cxcPagadas = await prisma.cuentaPorCobrar.count({
      where: { mes, estado: 'PAGADA' }
    });

    if (cxcPagadas > 0) {
      return NextResponse.json({ error: 'No se puede eliminar el mes porque ya tiene recibos pagados asociados. Reverso bloqueado por integridad contable.' }, { status: 400 });
    }

    // Comprobar si hay CxP liquidadas
    const cxpLiquidadas = await prisma.cuentaPorPagar.count({
      where: { mes, estado: 'LIQUIDADA' }
    });

    if (cxpLiquidadas > 0) {
      return NextResponse.json({ error: 'No se puede eliminar el mes porque ya tiene cuentas por pagar liquidadas.' }, { status: 400 });
    }

    // Transacción para eliminar todo
    await prisma.$transaction([
      prisma.cuentaPorCobrar.deleteMany({ where: { mes } }),
      prisma.cuentaPorPagar.deleteMany({ where: { mes } }),
      prisma.publicacionMensual.deleteMany({ where: { mes } })
    ]);

    return NextResponse.json({ success: true, message: 'Mes eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando publicacion:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
