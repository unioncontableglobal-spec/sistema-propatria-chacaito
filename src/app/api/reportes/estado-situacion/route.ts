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

    // Usar groupBy para sumar en BD
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

    const cuentaMap = new Map(cuentas.map(c => [c.id, c]));

    const activos: any[] = [];
    const pasivos: any[] = [];
    const patrimonio: any[] = [];
    
    // Calcular Resultado del Ejercicio (Ingresos - Egresos)
    let ingresosTotales = 0;
    let gastosTotales = 0;

    sumas.forEach(s => {
      const cuenta = cuentaMap.get(s.cuentaId);
      if (!cuenta) return;

      const totalDebe = s._sum.debe || 0;
      const totalHaber = s._sum.haber || 0;
      const saldoActual = cuenta.tipoSaldo === 'DEUDOR'
        ? totalDebe - totalHaber
        : totalHaber - totalDebe;

      // Solo incluimos cuentas con saldo distinto de 0
      if (Math.abs(saldoActual) < 0.01) return;

      const data = {
        codigo: cuenta.codigo,
        nombre: cuenta.nombre,
        saldo: saldoActual
      };

      if (cuenta.codigo.startsWith('1')) {
        activos.push(data);
      } else if (cuenta.codigo.startsWith('2')) {
        pasivos.push(data);
      } else if (cuenta.codigo.startsWith('3')) {
        patrimonio.push(data);
      } else if (cuenta.codigo.startsWith('4') || cuenta.codigo.startsWith('5')) {
        ingresosTotales += saldoActual;
      } else if (cuenta.codigo.startsWith('6') || cuenta.codigo.startsWith('7')) {
        gastosTotales += saldoActual;
      }
    });

    const resultadoEjercicio = ingresosTotales - gastosTotales;

    activos.sort((a, b) => a.codigo.localeCompare(b.codigo));
    pasivos.sort((a, b) => a.codigo.localeCompare(b.codigo));
    patrimonio.sort((a, b) => a.codigo.localeCompare(b.codigo));

    const totalActivos = activos.reduce((sum, c) => sum + c.saldo, 0);
    const totalPasivos = pasivos.reduce((sum, c) => sum + c.saldo, 0);
    let totalPatrimonio = patrimonio.reduce((sum, c) => sum + c.saldo, 0);
    
    // Sumar el resultado del ejercicio al patrimonio total
    totalPatrimonio += resultadoEjercicio;

    return NextResponse.json({
      activos,
      pasivos,
      patrimonio,
      resultadoEjercicio,
      totales: {
        activos: totalActivos,
        pasivos: totalPasivos,
        patrimonio: totalPatrimonio,
        pasivoMasPatrimonio: totalPasivos + totalPatrimonio,
        cuadrado: Math.abs(totalActivos - (totalPasivos + totalPatrimonio)) < 0.01
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      }
    });

  } catch (error: any) {
    console.error('Error al generar Estado de Situacion:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
