export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const idStr = (await params).id;
    const transaccion = await prisma.transaccion.findUnique({
      where: { id: parseInt(idStr) },
      include: {
        socio: true,
        formas_pago: true
      }
    });
    
    if (!transaccion) {
      return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 });
    }
    return NextResponse.json(transaccion);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching transaccion' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const idStr = (await params).id;
    // Delete related FormasPago first due to relation
    await prisma.formaPago.deleteMany({
      where: { transaccionId: parseInt(idStr) }
    });
    
    await prisma.transaccion.delete({
      where: { id: parseInt(idStr) },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error deleting transaccion' }, { status: 500 });
  }
}
