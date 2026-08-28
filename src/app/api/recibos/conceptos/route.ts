import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const socioId = searchParams.get('socioId');
    const mes = searchParams.get('mes');
    const tipo = searchParams.get('tipo'); // 'INGRESO_CXP' o 'EGRESO_CXP'

    if (!socioId || !mes || !tipo) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    if (tipo === 'INGRESO_CXP') {
      const deudas = await prisma.cuentaPorCobrar.findMany({
        where: {
          socioId: parseInt(socioId, 10),
          mes: mes,
          estado: 'PENDIENTE'
        }
      });

      const todasDeudas = await prisma.cuentaPorCobrar.findMany({
        where: {
          socioId: parseInt(socioId, 10),
          estado: 'PENDIENTE',
          mes: { not: mes }
        },
        select: { mes: true }
      });
      const mesesPendientes = Array.from(new Set(todasDeudas.map(d => d.mes))).sort();

      return NextResponse.json({ conceptos: deudas, mesesPendientes });
    } else if (tipo === 'EGRESO_CXP') {
      const beneficios = await prisma.cuentaPorPagar.findMany({
        where: {
          socioId: parseInt(socioId, 10),
          mes: mes,
          estado: 'PENDIENTE'
        }
      });
      return NextResponse.json({ conceptos: beneficios });
    }

    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });

  } catch (error) {
    console.error('Error fetching conceptos:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
