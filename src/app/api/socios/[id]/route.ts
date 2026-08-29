import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id);
    const body = await request.json();

    const { telefono, correo, direccion, placa, rif, numero_ficha, status } = body;

    const socio = await prisma.socio.update({
      where: { id },
      data: {
        telefono,
        correo,
        direccion,
        placa,
        rif,
        numero_ficha,
        status,
      }
    });

    return NextResponse.json(socio);
  } catch (error) {
    console.error('Error updating socio:', error);
    return NextResponse.json({ error: 'Error updating socio' }, { status: 500 });
  }
}
