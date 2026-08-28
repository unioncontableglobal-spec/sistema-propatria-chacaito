import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const terceros = await prisma.tercero.findMany({
      orderBy: { nombre: 'asc' }
    });
    return NextResponse.json(terceros);
  } catch (error) {
    console.error('Error fetching terceros:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { tipo, nombre, identificacion, telefono, direccion } = data;

    if (!tipo || !nombre) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const nuevoTercero = await prisma.tercero.create({
      data: {
        tipo,
        nombre: nombre.toUpperCase(),
        identificacion: identificacion ? identificacion.toUpperCase() : null,
        telefono,
        direccion
      }
    });

    return NextResponse.json(nuevoTercero);
  } catch (error) {
    console.error('Error creating tercero:', error);
    return NextResponse.json({ error: 'Error al crear el tercero' }, { status: 500 });
  }
}
