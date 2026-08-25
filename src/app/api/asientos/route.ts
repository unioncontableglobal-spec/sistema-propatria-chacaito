import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const asientos = await prisma.asientoContable.findMany({
      include: {
        detalles: {
          include: {
            cuenta: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    });
    return NextResponse.json(asientos);
  } catch (error) {
    console.error('Error fetching asientos:', error);
    return NextResponse.json({ error: 'Error al obtener asientos contables' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate request
    if (!data.fecha || !data.descripcion || !data.detalles || !Array.isArray(data.detalles)) {
      return NextResponse.json({ error: 'Faltan datos obligatorios para el asiento' }, { status: 400 });
    }
    
    // Calculate totals to ensure balance
    let totalDebe = 0;
    let totalHaber = 0;
    
    data.detalles.forEach((d: any) => {
      totalDebe += Number(d.debe || 0);
      totalHaber += Number(d.haber || 0);
    });
    
    // Need a small epsilon for floating point comparison
    if (Math.abs(totalDebe - totalHaber) > 0.001) {
      return NextResponse.json({ error: 'El asiento está descuadrado (Debe != Haber)' }, { status: 400 });
    }
    
    // Get next numero_asiento
    const lastAsiento = await prisma.asientoContable.findFirst({
      orderBy: { numero: 'desc' }
    });
    
    const nextNumero = lastAsiento ? lastAsiento.numero + 1 : 1;
    
    const newAsiento = await prisma.asientoContable.create({
      data: {
        numero: nextNumero,
        fecha: new Date(data.fecha),
        descripcion: data.descripcion,
        detalles: {
          create: data.detalles.map((d: any) => ({
            cuentaId: d.cuentaId,
            debe: Number(d.debe || 0),
            haber: Number(d.haber || 0)
          }))
        }
      },
      include: {
        detalles: true
      }
    });

    if (data.transaccionId) {
      await prisma.transaccion.update({
        where: { id: Number(data.transaccionId) },
        data: { asientoId: newAsiento.id }
      });
    }
    
    return NextResponse.json(newAsiento, { status: 201 });
  } catch (error) {
    console.error('Error creating asiento:', error);
    return NextResponse.json({ error: 'Error interno al guardar asiento contable' }, { status: 500 });
  }
}
