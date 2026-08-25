import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cuentas = await prisma.cuentaContable.findMany({
      orderBy: {
        codigo: 'asc'
      }
    });
    return NextResponse.json(cuentas);
  } catch (error) {
    console.error('Error fetching cuentas:', error);
    return NextResponse.json({ error: 'Error al obtener cuentas contables' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.codigo || !data.nombre || !data.tipoSaldo || !data.clase) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }
    
    // Verificar si el código ya existe
    const existing = await prisma.cuentaContable.findUnique({
      where: { codigo: data.codigo }
    });
    
    if (existing) {
      return NextResponse.json({ error: 'El código de cuenta ya existe' }, { status: 400 });
    }
    
    const nuevaCuenta = await prisma.cuentaContable.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        tipoSaldo: data.tipoSaldo,
        clase: data.clase
      }
    });
    
    return NextResponse.json(nuevaCuenta, { status: 201 });
  } catch (error) {
    console.error('Error creating cuenta:', error);
    return NextResponse.json({ error: 'Error al crear la cuenta contable' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.id || !data.codigo || !data.nombre || !data.tipoSaldo || !data.clase) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }
    
    // Verificar si el nuevo código ya lo tiene OTRA cuenta
    const existing = await prisma.cuentaContable.findUnique({
      where: { codigo: data.codigo }
    });
    
    if (existing && existing.id !== data.id) {
      return NextResponse.json({ error: 'El código de cuenta ya está en uso por otra cuenta' }, { status: 400 });
    }
    
    const cuentaActualizada = await prisma.cuentaContable.update({
      where: { id: data.id },
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        tipoSaldo: data.tipoSaldo,
        clase: data.clase
      }
    });
    
    return NextResponse.json(cuentaActualizada, { status: 200 });
  } catch (error) {
    console.error('Error updating cuenta:', error);
    return NextResponse.json({ error: 'Error al actualizar la cuenta contable' }, { status: 500 });
  }
}
