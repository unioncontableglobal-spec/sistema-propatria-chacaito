import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mes = searchParams.get('mes');
    const tipo = searchParams.get('tipo');
    const busqueda = searchParams.get('busqueda');

    let whereClause: any = {};

    if (mes) {
      whereClause.mes = mes;
    }

    if (tipo) {
      whereClause.tipo = tipo;
    }

    if (busqueda) {
      const search = busqueda.toUpperCase();
      whereClause.OR = [
        { recibo: { contains: search } },
        {
          socio: {
            OR: [
              { ficha: { contains: search } },
              { nombre_apellido: { contains: search } }
            ]
          }
        }
      ];
    }

    const transacciones = await prisma.transaccion.findMany({
      where: whereClause,
      include: {
        socio: {
          select: {
            ficha: true,
            nombre_apellido: true,
            cedula: true
          }
        },
        formas_pago: true
      },
      orderBy: {
        fecha: 'desc'
      },
      take: 200 // Limit to avoid massive payloads if no filter is applied
    });

    return NextResponse.json({ success: true, data: transacciones });
  } catch (error) {
    console.error('Error fetching historial de recibos:', error);
    return NextResponse.json({ error: 'Error al obtener el historial de recibos' }, { status: 500 });
  }
}
