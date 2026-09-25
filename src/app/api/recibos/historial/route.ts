export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { codigoPubToSelector, normalizarMes, selectorToCodigoPub } from '@/lib/mesUtils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mes = searchParams.get('mes');            // puede ser "ENERO" o "01-2026"
    const tipo = searchParams.get('tipo');           // "INGRESO" | "EGRESO"
    const clasificacion = searchParams.get('clasificacion');
    const busqueda = searchParams.get('busqueda');

    let whereClause: any = {};

    if (mes) {
      // ✅ Resiliencia: buscar tanto por el nombre ("ENERO") como por el código ("01-2026")
      let mesNom = mes.toUpperCase();
      let mesCode = mes;
      
      if (mes.includes('-')) {
        mesNom = codigoPubToSelector(mes).toUpperCase();
        mesCode = mes;
      } else {
        const _m = selectorToCodigoPub(mes);
        if (_m) mesCode = _m;
      }

      whereClause.mes = { in: [mesNom, mesCode] };
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

    const limitParam = searchParams.get('limit');
    const take = limitParam ? parseInt(limitParam) : 500;

    const transacciones = await prisma.transaccion.findMany({
      where: {
        ...whereClause,
        // ✅ Excluir registros NULOS y con monto 0 de la vista de auditoría
        NOT: [
          { clasificacion: 'NULO' },
          { clasificacion: 'ANULADO' },
          { clasificacion: 'ANULADA' },
        ],
        monto_bs: { gt: 0 }
      },
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
      take
    });

    return NextResponse.json({ success: true, data: transacciones });
  } catch (error) {
    console.error('Error fetching historial de recibos:', error);
    return NextResponse.json({ error: 'Error al obtener el historial de recibos' }, { status: 500 });
  }
}
