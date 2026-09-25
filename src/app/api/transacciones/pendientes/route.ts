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
    
    // En SQLite (Turso vs Local), las fechas a veces se guardan como string ISO y otras como numérico (epoch).
    // Usar gte/lte con objetos Date en Prisma suele fallar silenciosamente y retornar [].
    // Solución robusta: traer todas y filtrar en memoria (es muy rápido para miles de registros).
    const transacciones = await prisma.transaccion.findMany({
      include: {
        socio: true,
        formas_pago: true
      },
      orderBy: {
        fecha: 'asc'
      }
    });
    
    const transaccionesFiltradas = transacciones.filter(t => {
      if (!t.fecha) return false;
      const d = new Date(t.fecha);
      return d.getFullYear() === Number(year) && (d.getMonth() + 1) === Number(month);
    });

    return NextResponse.json(transaccionesFiltradas);
  } catch (error) {
    console.error('Error fetching pendientes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
