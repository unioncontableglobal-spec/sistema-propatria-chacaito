export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // ✅ OPTIMIZADO: Seleccionar solo campos necesarios y excluir NULOs/montos 0
    const [transacciones, cxcList, cxpList, socios] = await Promise.all([
      prisma.transaccion.findMany({
        select: {
          id: true,
          tipo: true,
          mes: true,
          monto_bs: true,
          monto_usd: true,
          tasa_cambio: true,
          clasificacion: true,
          socioId: true,
        },
        where: {
          NOT: [
            { clasificacion: 'NULO' },
            { clasificacion: 'ANULADO' },
            { clasificacion: 'ANULADA' },
          ],
          monto_bs: { gt: 0 }
        }
      }),
      prisma.cuentaPorCobrar.findMany({
        select: { mes: true, tipo_publicacion: true, monto_a_cobrar: true }
      }),
      prisma.cuentaPorPagar.findMany({
        select: { mes: true, monto: true, total: true }
      }),
      prisma.socio.findMany({
        select: {
          id: true,
          codigo: true,
          ficha: true,
          status: true,
          f_afiliacion: true,
          nombre_apellido: true
        }
      })
    ]);

    // 1. Calcular promedio realista de tasa por mes
    const ratesByMonth: Record<string, {sum: number, count: number}> = {};
    transacciones.forEach(t => {
      const tasa = Number(t.tasa_cambio || 0);
      const usd = Number(t.monto_usd || 0);
      const bs = Number(t.monto_bs || 0);
      if (usd === 1 && Math.abs(tasa - bs) < 1) return; // Excluir Efecto 1 USD
      if (tasa <= 1) return;
      const calcTasa = usd > 0 ? bs / usd : 0;
      if (Math.abs(calcTasa - tasa) > 5) return; // Matemática incoherente
      
      const mes = t.mes || 'ENERO';
      if (!ratesByMonth[mes]) ratesByMonth[mes] = { sum: 0, count: 0 };
      ratesByMonth[mes].sum += tasa;
      ratesByMonth[mes].count++;
    });

    const avgRateByMonth: Record<string, number> = {};
    for (const [mes, data] of Object.entries(ratesByMonth)) {
      avgRateByMonth[mes] = data.sum / data.count;
    }
    
    // Promedio global como fallback de seguridad
    let globalAvg = 360; 
    const validMonths = Object.values(avgRateByMonth);
    if (validMonths.length > 0) {
      globalAvg = validMonths.reduce((a, b) => a + b, 0) / validMonths.length;
    }

    // 2. Mapear transacciones inyectando el USD real
    const parseTransaction = (t: any) => {
      const mes = t.mes || 'ENERO';
      const bs = Number(t.monto_bs || 0);
      let usd = Number(t.monto_usd || 0);
      const tasa = Number(t.tasa_cambio || 0);

      // Si es Efecto 1 USD o no tiene USD real
      if ((usd === 1 && Math.abs(tasa - bs) < 1) || usd === 0) {
        const rate = avgRateByMonth[mes] || globalAvg;
        usd = rate > 0 ? bs / rate : 0;
      }
      return { mes, clasificacion: t.clasificacion || 'OTROS', montoBs: bs, montoUsd: usd };
    };

    const ingresosRaw = transacciones.filter(t => t.tipo === 'INGRESO').map(parseTransaction);
    const egresosRaw = transacciones.filter(t => t.tipo === 'EGRESO').map(parseTransaction);

    // 3. Mapear Meses para CxC y CxP (que usan formato 01-2026)
    const mapMonthDb = (dbMes: string | null) => {
      if (!dbMes) return 'ENERO';
      if (dbMes.startsWith('01-')) return 'ENERO';
      if (dbMes.startsWith('02-')) return 'FEBRERO';
      if (dbMes.startsWith('03-')) return 'MARZO';
      if (dbMes.startsWith('04-')) return 'ABRIL';
      if (dbMes.startsWith('05-')) return 'MAYO';
      if (dbMes.startsWith('06-')) return 'JUNIO';
      if (dbMes.startsWith('07-')) return 'JULIO';
      if (dbMes.startsWith('08-')) return 'AGOSTO';
      if (dbMes.startsWith('09-')) return 'SEPTIEMBRE';
      if (dbMes.startsWith('10-')) return 'OCTUBRE';
      if (dbMes.startsWith('11-')) return 'NOVIEMBRE';
      if (dbMes.startsWith('12-')) return 'DICIEMBRE';
      return dbMes.toUpperCase();
    };

    // Simplify CxC / CxP for now or use realistic values based on current schema
    const cxcRaw = cxcList.map(c => ({
      mes: mapMonthDb(c.mes),
      fianzas: c.tipo_publicacion === 'FIANZA' ? c.monto_a_cobrar : 0,
      ayudasBs: c.tipo_publicacion?.includes('AYUDA') ? c.monto_a_cobrar : 0,
      vidrios: c.tipo_publicacion?.includes('VIDRIO') ? c.monto_a_cobrar : 0,
      montepio: c.tipo_publicacion?.includes('MONTEPIO') ? c.monto_a_cobrar : 0,
      grua: c.tipo_publicacion?.includes('GRUA') ? c.monto_a_cobrar : 0,
    }));

    const cxpRaw = cxpList.map(p => ({
      mes: mapMonthDb(p.mes),
      montoUsd: p.total || p.monto
    }));

    const sociosActivosRaw = socios
      .filter(s => s.status === 'ACTIVO')
      .map(s => {
        let tipo = 'SA';
        if (s.codigo?.startsWith('SB') || s.ficha?.startsWith('SB')) tipo = 'SB';
        
        let mes = 'ENERO'; // default if no date
        if (s.f_afiliacion) {
          const month = s.f_afiliacion.toLocaleString('es-ES', { month: 'long', timeZone: 'UTC' });
          mes = month.charAt(0).toUpperCase() + month.slice(1);
        } else {
          mes = 'HISTÓRICO TRIMESTRAL';
        }
        return { mes, tipo };
      });

    // Nuevos ingresos: parse f_afiliacion from socios
    const nuevosIngresosRaw: { mes: string; ficha: string }[] = socios
      .filter(s => s.f_afiliacion !== null)
      .map(s => {
        const month = s.f_afiliacion!.toLocaleString('es-ES', { month: 'long', timeZone: 'UTC' });
        const mes = month.charAt(0).toUpperCase() + month.slice(1);
        let ficha = 'SA';
        if (s.codigo?.startsWith('SB') || s.ficha?.startsWith('SB')) ficha = 'SB';
        return { mes, ficha };
      });

    let tasaReferencial = globalAvg;

    const rawData = {
      ingresosRaw,
      egresosRaw,
      cxcRaw,
      cxpRaw,
      sociosActivosRaw,
      nuevosIngresosRaw,
      tasaReferencial,
      tasaPorMes: avgRateByMonth
    };

    return NextResponse.json(rawData);
  } catch (error) {
    console.error('Error fetching dashboard raw data:', error);
    return NextResponse.json({ error: 'Error fetching dashboard data' }, { status: 500 });
  }
}
