import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { selectorToYyyyMm } from '@/lib/mesUtils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mes = searchParams.get('mes') || '';

    let dateFilter: any = undefined;
    
    if (mes && mes !== 'HISTORICO' && mes !== 'HISTÓRICO TOTAL') {
      const yyyymm = selectorToYyyyMm(mes);
      if (yyyymm) {
        const [yearStr, monthStr] = yyyymm.split('-');
        const endDate = new Date(Number(yearStr), Number(monthStr), 0, 23, 59, 59);
        dateFilter = { fecha: { lte: endDate } };
      }
    }

    // ✅ OPTIMIZADO: Usar groupBy para sumar en BD en vez de cargar todos los registros
    // Primero obtenemos los saldos agrupados por cuenta
    const [sumas, cuentas] = await Promise.all([
      prisma.detalleAsiento.groupBy({
        by: ['cuentaId'],
        where: dateFilter ? { asiento: dateFilter } : undefined,
        _sum: {
          debe: true,
          haber: true,
        },
      }),
      prisma.cuentaContable.findMany({
        select: {
          id: true,
          codigo: true,
          nombre: true,
          tipoSaldo: true,
          clase: true,
        }
      })
    ]);

    // Crear mapa de cuentas para lookup rápido
    const cuentaMap = new Map(cuentas.map(c => [c.id, c]));

    // Construir resultado
    const resultado = sumas
      .map(s => {
        const cuenta = cuentaMap.get(s.cuentaId);
        if (!cuenta) return null;

        const totalDebe = s._sum.debe || 0;
        const totalHaber = s._sum.haber || 0;
        const saldoActual = cuenta.tipoSaldo === 'DEUDOR'
          ? totalDebe - totalHaber
          : totalHaber - totalDebe;

        return {
          codigo: cuenta.codigo,
          nombre: cuenta.nombre,
          tipoSaldo: cuenta.tipoSaldo,
          clase: cuenta.clase,
          totalDebe,
          totalHaber,
          saldoActual,
        };
      })
      .filter(Boolean) as any[];

    // Ordenar por código contable
    resultado.sort((a, b) => a.codigo.localeCompare(b.codigo));

    // Totales
    const totalDebe = resultado.reduce((acc, c) => acc + c.totalDebe, 0);
    const totalHaber = resultado.reduce((acc, c) => acc + c.totalHaber, 0);

    return NextResponse.json(
      {
        cuentas: resultado,
        totales: {
          debe: totalDebe,
          haber: totalHaber,
          cuadrado: Math.abs(totalDebe - totalHaber) < 0.01
        }
      },
      {
        headers: {
          // Cache 30 segundos en navegador, 60 en CDN
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        }
      }
    );

  } catch (error: any) {
    console.error('Error al generar Balance de Comprobacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
