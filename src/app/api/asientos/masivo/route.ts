import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { mes } = await req.json(); // "2026-01"
    
    if (!mes) {
      return NextResponse.json({ error: 'Falta el parámetro mes' }, { status: 400 });
    }

    const [year, month] = mes.split('-');

    // 1. Buscar transacciones pendientes
    const transacciones = await prisma.transaccion.findMany({
      where: { asientoId: null },
      include: { formas_pago: true, socio: true }
    });

    const pendientes = transacciones.filter(t => {
      if (!t.fecha) return false;
      const d = new Date(t.fecha);
      return d.getFullYear() === Number(year) && (d.getMonth() + 1) === Number(month);
    });

    if (pendientes.length === 0) {
      return NextResponse.json({ message: 'No hay asientos pendientes para generar en este mes.', count: 0 });
    }

    // 2. Traer las cuentas para validación
    const cuentas = await prisma.cuentaContable.findMany();
    const mapCuentas = new Map(cuentas.map(c => [c.codigo, c.id]));

    // Códigos por defecto si no están en el mapa
    const DEFAULT_CAJA = mapCuentas.get('1101001');
    const DEFAULT_INGRESO = mapCuentas.get('4101011'); // Otros Ingresos
    const DEFAULT_EGRESO = mapCuentas.get('6104031'); // Otros Gastos de Operación

    let count = 0;

    // Procesar cada uno
    for (const t of pendientes) {
      const socioNombre = t.socio ? ` - ${t.socio.nombre_apellido}` : '';
      const concepto = t.codigo_concepto || t.clasificacion || t.detalle || '';
      
      let pagoStr = '';
      let bancoId = DEFAULT_CAJA;

      if (t.formas_pago && t.formas_pago.length > 0) {
        const fp = t.formas_pago[0];
        pagoStr = ` (Vía: ${fp.tipo_pago}${fp.banco ? ` ${fp.banco}` : ''}${fp.referencia ? ` Ref: ${fp.referencia}` : ''})`;
        
        // Mapeo simple de bancos
        const b = (fp.banco || '').toUpperCase();
        if (b.includes('BANCAMIGA-9750')) bancoId = mapCuentas.get('1102005');
        else if (b.includes('BANCAMIGA')) bancoId = mapCuentas.get('1102001');
        else if (b.includes('BANESCO')) bancoId = mapCuentas.get('1102004');
        else if (b.includes('MERCANTIL')) bancoId = mapCuentas.get('1102002');
        else if (b.includes('VENEZUELA')) bancoId = mapCuentas.get('1102003');
        else if (b.includes('A.C.P.C.CH')) bancoId = mapCuentas.get('1102006'); // Banco A.C.P.C.CH
        else if (fp.tipo_pago.toUpperCase().includes('EFECTIVO')) bancoId = mapCuentas.get('1101001'); // Caja Principal
      }

      const descripcion = `Contabilización automática de ${t.tipo} Recibo #${t.recibo}${socioNombre}: ${concepto}${pagoStr}`;

      let cuentaDebe: number | undefined;
      let cuentaHaber: number | undefined;

      if (t.tipo === 'INGRESO') {
        cuentaDebe = bancoId || DEFAULT_CAJA;
        cuentaHaber = DEFAULT_INGRESO;
      } else {
        cuentaDebe = DEFAULT_EGRESO;
        cuentaHaber = bancoId || DEFAULT_CAJA;
      }

      if (!cuentaDebe || !cuentaHaber) {
        console.warn('Saltando transaccion por falta de cuenta', t.id);
        continue;
      }
      
      // Auto-generar número de asiento temporal (si no usamos autoincrement directamente)
      const numero = Date.now() + count; 

      // Crear el asiento
      const asiento = await prisma.asientoContable.create({
        data: {
          numero,
          fecha: t.fecha,
          descripcion,
          detalles: {
            create: [
              { cuentaId: cuentaDebe, debe: t.monto_bs, haber: 0 },
              { cuentaId: cuentaHaber, debe: 0, haber: t.monto_bs }
            ]
          }
        }
      });

      // Actualizar la transacción
      await prisma.transaccion.update({
        where: { id: t.id },
        data: { asientoId: asiento.numero }
      });
      
      count++;
    }

    return NextResponse.json({ message: 'Procesamiento exitoso', count });
  } catch (error: any) {
    console.error('Error en contabilización masiva:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}
