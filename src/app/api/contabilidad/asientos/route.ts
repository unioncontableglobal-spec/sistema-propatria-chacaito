import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const asientos = await prisma.asientoContable.findMany({
      include: {
        detalles: {
          include: {
            cuenta: true
          }
        },
        transaccion: true
      },
      orderBy: {
        fecha: 'desc'
      },
      take: 100 // Limitar temporalmente para evitar sobrecarga
    });

    return NextResponse.json(asientos);
  } catch (error) {
    console.error('Error fetching asientos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
