export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const categorias = await prisma.categoriaMovimiento.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
    return NextResponse.json(categorias);
  } catch (error) {
    console.error('Error fetching categorias:', error);
    return NextResponse.json({ error: 'Error fetching data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const newCategoria = await prisma.categoriaMovimiento.create({
      data: {
        nombre: data.nombre.trim().toUpperCase(),
        tipo: data.tipo,
        codigo: data.codigo,
        activo: true
      }
    });
    return NextResponse.json(newCategoria);
  } catch (error) {
    console.error('Error creating categoria:', error);
    return NextResponse.json({ error: 'Error creating data' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, nombre, tipo, codigo, activo } = data;
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const updated = await prisma.categoriaMovimiento.update({
      where: { id: parseInt(id.toString(), 10) },
      data: {
        nombre: nombre ? nombre.trim().toUpperCase() : undefined,
        tipo,
        codigo,
        activo
      }
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating categoria:', error);
    return NextResponse.json({ error: 'Error updating data' }, { status: 500 });
  }
}
