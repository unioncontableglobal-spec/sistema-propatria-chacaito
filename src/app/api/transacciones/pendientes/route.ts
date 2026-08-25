import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const mes = searchParams.get('mes'); // Formato YYYY-MM
    
    if (!mes) {
      return NextResponse.json({ error: 'Falta el parámetro mes (YYYY-MM)' }, { status: 400 });
    }
    
    const [year, month] = mes.split('-');
    
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

    const transacciones = await prisma.transaccion.findMany({
      where: {
        fecha: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        socio: true,
        formas_pago: true
      },
      orderBy: {
        fecha: 'asc'
      }
    });
    
    return NextResponse.json(transacciones);
  } catch (error) {
    console.error('Error fetching pendientes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
