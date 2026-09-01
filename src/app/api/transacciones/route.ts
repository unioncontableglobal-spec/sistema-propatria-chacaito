export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo'); // "INGRESO" or "EGRESO"
    
    const where = tipo ? { tipo } : {};

    const transacciones = await prisma.transaccion.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        socio: {
          select: { nombre_apellido: true, cedula: true, ficha: true }
        },
        formas_pago: true
      }
    });
    return NextResponse.json(transacciones);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching transacciones' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      tipo, recibo, fecha, mes, socioId, monto_bs, monto_usd, 
      tasa_cambio, clasificacion, codigo_concepto, detalle, formas_pago 
    } = body;

    // Validate required fields
    if (!tipo || monto_bs === undefined) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const transaccion = await prisma.transaccion.create({
      data: {
        tipo,
        recibo,
        fecha: fecha ? new Date(fecha) : new Date(),
        mes,
        socioId: socioId ? parseInt(socioId) : null,
        monto_bs: parseFloat(monto_bs),
        monto_usd: monto_usd ? parseFloat(monto_usd) : null,
        tasa_cambio: tasa_cambio ? parseFloat(tasa_cambio) : null,
        clasificacion,
        codigo_concepto,
        detalle,
        formas_pago: formas_pago && formas_pago.length > 0 ? {
          create: formas_pago.map((fp: any) => ({
            tipo_pago: fp.tipo_pago,
            referencia: fp.referencia,
            banco: fp.banco,
            monto_bs: parseFloat(fp.monto_bs),
            tasa_cambio: fp.tasa_cambio ? parseFloat(fp.tasa_cambio) : null,
            monto_usd: fp.monto_usd ? parseFloat(fp.monto_usd) : null,
          }))
        } : undefined
      },
      include: {
        formas_pago: true,
        socio: true
      }
    });

    return NextResponse.json(transaccion, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al registrar la transacción' }, { status: 500 });
  }
}
