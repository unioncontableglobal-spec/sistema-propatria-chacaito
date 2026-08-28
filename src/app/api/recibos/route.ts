import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      tipo,
      recibo,
      socioId,
      conceptos,
      pago,
      fecha,
      mes,
      montoTotalBs,
      montoTotalUsd
    } = data;

    // Create the transaction
    const transaccion = await prisma.transaccion.create({
      data: {
        tipo,
        recibo,
        fecha: new Date(fecha),
        mes,
        socioId: socioId ? parseInt(socioId.toString(), 10) : null,
        monto_bs: montoTotalBs,
        monto_usd: montoTotalUsd,
        tasa_cambio: pago.tasa_cambio,
        clasificacion: data.clasificacion || 'RECIBO',
        detalle: JSON.stringify(conceptos), // Guardamos los conceptos como JSON
        formas_pago: {
          create: {
            tipo_pago: pago.tipo_pago,
            referencia: pago.referencia,
            banco: pago.banco,
            monto_bs: pago.monto_bs,
            monto_usd: pago.monto_usd,
            tasa_cambio: pago.tasa_cambio,
          }
        }
      }
    });

    // Update CuentasPorCobrar if this is an INGRESO
    if (tipo === 'INGRESO' && socioId) {
      for (const concepto of conceptos) {
        // Here we do a basic matching based on descriptions or codes
        // If a specific debt is being paid, we can mark it as "PAGADA"
        // This is a simplified logic. Adjust according to exact naming conventions.
        
        let tipoPub = concepto.descripcion.toUpperCase();
        if (tipoPub.includes('FINANZAS')) tipoPub = 'FINANZAS';
        else if (tipoPub.includes('VIDRIO')) tipoPub = 'VIDRIOS';
        else if (tipoPub.includes('MONTEPIO')) tipoPub = 'MONTEPIO';

        await prisma.cuentaPorCobrar.updateMany({
          where: {
            socioId: parseInt(socioId.toString(), 10),
            estado: 'PENDIENTE',
            tipo_publicacion: tipoPub
            // Ideamente también filtrar por mes si aplica
          },
          data: {
            estado: 'PAGADA'
          }
        });
      }
    }

    return NextResponse.json({ success: true, transaccion });
  } catch (error) {
    console.error('Error creating recibo:', error);
    return NextResponse.json({ error: 'Error al procesar el recibo' }, { status: 500 });
  }
}
