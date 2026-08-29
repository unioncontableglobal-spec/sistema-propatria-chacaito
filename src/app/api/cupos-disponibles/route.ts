import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Generar todos los cupos posibles
    const todosSA = Array.from({ length: 251 }, (_, i) => `SA${String(i + 1).padStart(3, '0')}`);
    const todosSB = Array.from({ length: 156 }, (_, i) => `SB${String(i + 1).padStart(3, '0')}`);
    const todosLosCupos = [...todosSA, ...todosSB];

    // 2. Buscar cupos ocupados (status ACTIVO con código válido)
    const sociosActivos = await prisma.socio.findMany({
      where: {
        status: 'ACTIVO',
        codigo: {
          not: null
        }
      },
      select: { codigo: true }
    });

    const cuposOcupados = new Set(sociosActivos.map(s => s.codigo));

    // 3. Filtrar los disponibles
    const cuposDisponibles = todosLosCupos.filter(c => !cuposOcupados.has(c));

    return NextResponse.json({ success: true, data: cuposDisponibles });
  } catch (error) {
    console.error('Error calculando cupos disponibles:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
