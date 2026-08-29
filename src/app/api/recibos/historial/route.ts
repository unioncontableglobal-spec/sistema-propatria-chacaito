import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mes = searchParams.get('mes');
    const tipo = searchParams.get('tipo');
    const clasificacion = searchParams.get('clasificacion');
    const busqueda = searchParams.get('busqueda');

    let whereClause: any = {};

    if (mes) {
      whereClause.mes = mes;
    }

    if (tipo) {
      whereClause.tipo = tipo;
    }

    if (clasificacion) {
      if (clasificacion === 'INGRESO_CXP') {
        whereClause.tipo = 'INGRESO';
        whereClause.clasificacion = { in: ['INGRESO_CXP', 'FINANZAS', 'VIDRIO', 'MONTEPIOS', 'GRUA', 'CxC 2025'] };
      } else if (clasificacion === 'INGRESO_VARIOS') {
        whereClause.tipo = 'INGRESO';
        whereClause.clasificacion = { notIn: ['INGRESO_CXP', 'FINANZAS', 'VIDRIO', 'MONTEPIOS', 'GRUA', 'CxC 2025'] };
      } else if (clasificacion === 'EGRESO_CXP') {
        whereClause.tipo = 'EGRESO';
        whereClause.clasificacion = { in: ['EGRESO_CXP', 'PAGO VIDRIOS', 'PAGO MONTEPIO', 'PAGO DE AYUDAS'] };
      } else if (clasificacion === 'EGRESO_ADMIN') {
        whereClause.tipo = 'EGRESO';
        whereClause.clasificacion = { notIn: ['EGRESO_CXP', 'PAGO VIDRIOS', 'PAGO MONTEPIO', 'PAGO DE AYUDAS'] };
      } else {
        whereClause.clasificacion = clasificacion;
      }
    }

    if (busqueda) {
      const search = busqueda.toUpperCase();
      whereClause.OR = [
        { recibo: { contains: search } },
        { clasificacion: { contains: search } },
        { codigo_concepto: { contains: search } },
        {
          socio: {
            OR: [
              { ficha: { contains: search } },
              { nombre_apellido: { contains: search } }
            ]
          }
        },
        {
          tercero: {
            OR: [
              { nombre: { contains: search } },
              { identificacion: { contains: search } }
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
        tercero: {
          select: {
            nombre: true,
            identificacion: true,
            tipo: true
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
