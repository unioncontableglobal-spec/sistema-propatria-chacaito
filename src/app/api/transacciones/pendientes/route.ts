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
    
    // 1. Obtener todas sin include (evita el límite de 999 variables de SQLite)
    const transacciones = await prisma.transaccion.findMany({
      orderBy: { fecha: 'asc' }
    });
    
    // 2. Filtrar en JS por la incompatibilidad de fechas en SQLite (String vs Int)
    const transaccionesFiltradas = transacciones.filter(t => {
      if (!t.fecha) return false;
      const d = new Date(t.fecha);
      return d.getFullYear() === Number(year) && (d.getMonth() + 1) === Number(month);
    });

    // 3. Obtener relaciones (Socio) manualmente para las ~700 transacciones filtradas (dentro del límite)
    const socioIds = [...new Set(transaccionesFiltradas.map(t => t.socioId).filter(Boolean))];
    const socios = await prisma.socio.findMany({
      where: { id: { in: socioIds as number[] } }
    });
    const socioMap = new Map(socios.map(s => [s.id, s]));

    // 4. Mapear
    const resultado = transaccionesFiltradas.map(t => ({
      ...t,
      socio: t.socioId ? socioMap.get(t.socioId) || null : null
    }));

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error fetching pendientes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
