import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const socioId = searchParams.get('socioId');
    const mes = searchParams.get('mes');
    const clasificacion = searchParams.get('clasificacion'); // 'INGRESO_CXP' o 'EGRESO_CXP'

    if (!socioId || !mes || !clasificacion) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const existingTransaccion = await prisma.transaccion.findFirst({
      where: {
        socioId: parseInt(socioId, 10),
        mes: mes,
        clasificacion: clasificacion
      }
    });

    return NextResponse.json({ exists: !!existingTransaccion });
  } catch (error) {
    console.error('Error checking transaccion:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
