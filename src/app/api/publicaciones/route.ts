import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const publicaciones = await prisma.publicacionMensual.findMany({
      orderBy: { fecha_pub: 'desc' }
    });
    return NextResponse.json(publicaciones);
  } catch (error) {
    console.error('Error fetching publicaciones:', error);
    return NextResponse.json({ error: 'Error al obtener publicaciones' }, { status: 500 });
  }
}
