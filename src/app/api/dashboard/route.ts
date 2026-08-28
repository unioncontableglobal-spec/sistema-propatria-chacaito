import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const transacciones = await prisma.transaccion.findMany();
    const cxcList = await prisma.cuentaPorCobrar.findMany();
    const cxpList = await prisma.cuentaPorPagar.findMany();
    const socios = await prisma.socio.findMany();

    const ingresosRaw = transacciones
      .filter(t => t.tipo === 'INGRESO')
      .map(t => ({ mes: t.mes || 'ENERO', clasificacion: t.clasificacion || 'OTROS', montoBs: t.monto_bs }));

    const egresosRaw = transacciones
      .filter(t => t.tipo === 'EGRESO')
      .map(t => ({ mes: t.mes || 'ENERO', clasificacion: t.clasificacion || 'OTROS', montoBs: t.monto_bs }));

    // Simplify CxC / CxP for now or use realistic values based on current schema
    const cxcRaw = cxcList.map(c => ({
      mes: c.mes || 'ENERO',
      fianzas: c.tipo_publicacion === 'FIANZA' ? c.monto_a_cobrar : 0,
      ayudasBs: c.tipo_publicacion?.includes('AYUDA') ? c.monto_a_cobrar : 0,
      vidrios: c.tipo_publicacion?.includes('VIDRIO') ? c.monto_a_cobrar : 0,
      montepio: c.tipo_publicacion?.includes('MONTEPIO') ? c.monto_a_cobrar : 0,
      grua: c.tipo_publicacion?.includes('GRUA') ? c.monto_a_cobrar : 0,
    }));

    const cxpRaw = cxpList.map(p => ({
      mes: p.mes || 'ENERO',
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

    const rawData = {
      ingresosRaw,
      egresosRaw,
      cxcRaw,
      cxpRaw,
      sociosActivosRaw,
      nuevosIngresosRaw
    };

    return NextResponse.json(rawData);
  } catch (error) {
    console.error('Error fetching dashboard raw data:', error);
    return NextResponse.json({ error: 'Error fetching dashboard data' }, { status: 500 });
  }
}
