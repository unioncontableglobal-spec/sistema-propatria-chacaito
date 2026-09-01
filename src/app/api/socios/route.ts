import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toUpperCase() || '';
    const status = searchParams.get('status') || '';

    const where: any = {};

    if (status && status !== 'TODOS') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { nombre_apellido: { contains: search } },
        { cedula: { contains: search } },
        { ficha: { contains: search } },
        { codigo: { contains: search } }
      ];
    }

    const socios = await prisma.socio.findMany({
      where,
      orderBy: { id: 'asc' } // Assuming id represents the natural order, since codigo might have some missing or weird formatting
    });

    return NextResponse.json(socios);
  } catch (error) {
    console.error('Error fetching socios:', error);
    return NextResponse.json({ error: 'Error fetching socios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newSocio = await prisma.socio.create({
      data: body
    });
    return NextResponse.json(newSocio);
  } catch (error) {
    return NextResponse.json({ error: 'Error creating socio' }, { status: 500 });
  }
}
