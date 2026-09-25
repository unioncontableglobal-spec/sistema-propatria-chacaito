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

    // Códigos por defecto basados en el Estado Financiero 2024 (PDF)
    const DEFAULT_CAJA = mapCuentas.get('1101001'); // Caja Principal
    const INGRESO_FINANZAS = mapCuentas.get('4102002'); // Aportes Socios Por Cuotas Ordinarias Finanzas
    const INGRESO_SOSTENIMIENTO = mapCuentas.get('4102003'); // Aportes Socios Varios Para Sostenimiento Asociación
    const GASTO_DEFAULT = mapCuentas.get('6106009'); // Gastos de Administración
    const GASTO_PERSONAL = mapCuentas.get('6106005'); // Remuneraciones al Personal
    const GASTO_BANCARIO = mapCuentas.get('6106006'); // Gastos Bancarios

    let count = 0;
    const ops: any[] = [];

      // Calcular número de asiento base para este lote
      const lastAsiento = await prisma.asientoContable.findFirst({
        orderBy: { numero: 'desc' }
      });
      const startNumero = lastAsiento ? lastAsiento.numero + 1 : 1;

      // Procesar cada uno
      for (const t of pendientes) {
        const socioNombre = t.socio ? ` - ${t.socio.nombre_apellido}` : '';
        const concepto = t.codigo_concepto || t.clasificacion || t.detalle || '';
        
        let pagoStr = '';
        let bancoId = DEFAULT_CAJA;

        if (t.formas_pago && t.formas_pago.length > 0) {
          const fp = t.formas_pago[0];
          pagoStr = ` (Vía: ${fp.tipo_pago}${fp.banco ? ` ${fp.banco}` : ''}${fp.referencia ? ` Ref: ${fp.referencia}` : ''})`;
          
          // Mapeo inteligente con prioridad a EFECTIVO
          const tipoPago = fp.tipo_pago.toUpperCase();
          const b = (fp.banco || '').toUpperCase();
          
          if (tipoPago.includes('EFECTIVO')) {
            bancoId = mapCuentas.get('1101001'); // Caja Principal (Efectivo y Equivalentes)
          } else if (b.includes('BANCAMIGA-9750')) {
            bancoId = mapCuentas.get('1102005');
          } else if (b.includes('BANCAMIGA')) {
            bancoId = mapCuentas.get('1102001');
          } else if (b.includes('BANESCO')) {
            bancoId = mapCuentas.get('1102004');
          } else if (b.includes('MERCANTIL')) {
            bancoId = mapCuentas.get('1102002');
          } else if (b.includes('VENEZUELA')) {
            bancoId = mapCuentas.get('1102003');
          } else if (b.includes('A.C.P.C.CH')) {
            bancoId = mapCuentas.get('1102006');
          }
        }

        const descripcion = `Contabilización automática de ${t.tipo} Recibo #${t.recibo}${socioNombre}: ${concepto}${pagoStr}`;

        // ----------------------------------------------------
        // LÓGICA PREDICTIVA DE CUENTAS SEGÚN EL PDF 2024
        // ----------------------------------------------------
        let cuentaDebe: number | undefined;
        let cuentaHaber: number | undefined;
        const classUpper = (t.clasificacion || '').toUpperCase();
        const concUpper = (t.codigo_concepto || '').toUpperCase();

        if (t.tipo === 'INGRESO') {
          cuentaDebe = bancoId || DEFAULT_CAJA;
          
          // Asignación predictiva de Ingresos
          if (classUpper.includes('FINANZAS') || concUpper.includes('FINANZAS')) {
            cuentaHaber = INGRESO_FINANZAS;
          } else {
            // Todo lo demás de ingresos (Cuotas especiales, mantenimiento, calcomanías, etc)
            cuentaHaber = INGRESO_SOSTENIMIENTO;
          }

        } else {
          cuentaHaber = bancoId || DEFAULT_CAJA;

          // Asignación predictiva de Gastos
          if (classUpper.includes('SUELDO') || classUpper.includes('PERSONAL') || classUpper.includes('HONORARIO')) {
            cuentaDebe = GASTO_PERSONAL;
          } else if (classUpper.includes('BANCO') || classUpper.includes('COMISION')) {
            cuentaDebe = GASTO_BANCARIO;
          } else {
            cuentaDebe = GASTO_DEFAULT; // Gastos de Administración por defecto para todo lo demás
          }
        }

        if (!cuentaDebe || !cuentaHaber) {
          console.warn('Saltando transaccion por falta de cuenta', t.id);
          continue;
        }
        
        const numero = startNumero + count; 
        
        // En lugar de pushear operaciones asincronas sueltas,
        // vamos a guardar la estructura de datos que necesitamos para el interactive transaction.
        ops.push({ 
          transaccion: t, 
          cuentaDebe, 
          cuentaHaber, 
          numero, 
          descripcion 
        });
        
        count++;
    }

    // Procesar solo los primeros 50 para evitar Vercel Timeout (10s) y SQLITE_BUSY (concurrencia)
    // El frontend llamará a esta API repetidamente hasta terminar
    const BATCH_SIZE = 50;
    const batch = ops.slice(0, BATCH_SIZE);
    
    for (const op of batch) {
      // 1. Crear AsientoContable
      const asiento = await prisma.asientoContable.create({
        data: {
          numero: op.numero,
          fecha: op.transaccion.fecha,
          descripcion: op.descripcion,
          detalles: {
            create: [
              { cuentaId: op.cuentaDebe, debe: op.transaccion.monto_bs, haber: 0 },
              { cuentaId: op.cuentaHaber, debe: 0, haber: op.transaccion.monto_bs }
            ]
          }
        }
      });

      // 2. Actualizar Transaccion
      await prisma.transaccion.update({
        where: { id: op.transaccion.id },
        data: { asientoId: asiento.id } 
      });
    }

    const remaining = Math.max(0, ops.length - BATCH_SIZE);

    return NextResponse.json({ 
      message: remaining > 0 ? 'Procesamiento parcial exitoso' : 'Procesamiento total exitoso', 
      count: batch.length,
      remaining 
    });
  } catch (error: any) {
    console.error('Error en contabilización masiva:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}
