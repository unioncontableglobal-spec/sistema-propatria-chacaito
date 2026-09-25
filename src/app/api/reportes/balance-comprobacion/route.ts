import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mes = searchParams.get('mes') || '';

    // Si es mes historico o no hay mes, tomamos todo.
    // Si hay un mes específico (ej. "2026-01"), tomamos transacciones <= a ese mes.
    // Por simplicidad, el Balance de Comprobación muestra el acumulado hasta esa fecha.

    let dateFilter = {};
    if (mes && mes !== 'HISTORICO' && mes !== 'HISTÓRICO TOTAL' && mes.includes('-')) {
      const [yearStr, monthStr] = mes.split('-');
      // Ultimo dia del mes seleccionado
      const endDate = new Date(Number(yearStr), Number(monthStr), 0, 23, 59, 59);
      dateFilter = {
        fecha: {
          lte: endDate
        }
      };
    }

    // 1. Obtener todos los detalles de asiento hasta la fecha de corte
    const detalles = await prisma.detalleAsiento.findMany({
      where: {
        asiento: dateFilter
      },
      include: {
        cuenta: true
      }
    });

    // 2. Agrupar por cuenta contable
    const saldos = new Map();

    for (const d of detalles) {
      if (!saldos.has(d.cuenta.codigo)) {
        saldos.set(d.cuenta.codigo, {
          codigo: d.cuenta.codigo,
          nombre: d.cuenta.nombre,
          tipoSaldo: d.cuenta.tipoSaldo,
          clase: d.cuenta.clase,
          totalDebe: 0,
          totalHaber: 0,
          saldoActual: 0
        });
      }

      const info = saldos.get(d.cuenta.codigo);
      info.totalDebe += d.debe || 0;
      info.totalHaber += d.haber || 0;
    }

    // 3. Calcular saldos finales
    const resultado = Array.from(saldos.values()).map(c => {
      // Si la cuenta es de naturaleza DEUDORA (Activos, Gastos)
      // Saldo = Debe - Haber
      if (c.tipoSaldo === 'DEUDOR') {
        c.saldoActual = c.totalDebe - c.totalHaber;
      } 
      // Si la cuenta es de naturaleza ACREEDORA (Pasivos, Patrimonio, Ingresos)
      // Saldo = Haber - Debe
      else {
        c.saldoActual = c.totalHaber - c.totalDebe;
      }
      return c;
    });

    // Ordenar por código contable
    resultado.sort((a, b) => a.codigo.localeCompare(b.codigo));

    // Totales del Balance
    const totalDebe = resultado.reduce((acc, c) => acc + c.totalDebe, 0);
    const totalHaber = resultado.reduce((acc, c) => acc + c.totalHaber, 0);

    return NextResponse.json({
      cuentas: resultado,
      totales: {
        debe: totalDebe,
        haber: totalHaber,
        cuadrado: Math.abs(totalDebe - totalHaber) < 0.01
      }
    });

  } catch (error: any) {
    console.error('Error al generar Balance de Comprobacion:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}
