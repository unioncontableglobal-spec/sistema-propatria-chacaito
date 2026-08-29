import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    const transacciones = await prisma.transaccion.findMany({
      where: { socioId: id },
      include: {
        formas_pago: true
      },
      orderBy: { fecha: 'desc' }
    });

    const cxc = await prisma.cuentaPorCobrar.findMany({
      where: { socioId: id, estado: 'PENDIENTE' },
      orderBy: { mes: 'desc' }
    });

    const cxp = await prisma.cuentaPorPagar.findMany({
      where: { socioId: id, estado: 'PENDIENTE' },
      orderBy: { mes: 'desc' }
    });

    return NextResponse.json({ success: true, data: { transacciones, cxc, cxp } });
  } catch (error) {
    console.error('Error fetching historial completo de socio:', error);
    return NextResponse.json({ error: 'Error al obtener el historial completo del socio' }, { status: 500 });
  }
}
