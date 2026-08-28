import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { recibo: string } }) {
  try {
    const { recibo } = params;
    
    if (!recibo) {
      return NextResponse.json({ error: 'Recibo no especificado' }, { status: 400 });
    }

    const transacciones = await prisma.transaccion.findMany({
      where: { recibo },
      include: {
        socio: {
          select: {
            ficha: true,
            nombre_apellido: true,
            cedula: true
          }
        },
        formas_pago: true
      }
    });

    if (!transacciones || transacciones.length === 0) {
      return NextResponse.json({ error: 'Recibo no encontrado' }, { status: 404 });
    }

    // El recibo base será la primera transacción
    const baseTx = transacciones[0];
    
    let conceptos: any[] = [];
    let granTotalBs = 0;
    
    // Agrupar todos los conceptos de todas las transacciones de este recibo
    transacciones.forEach((tx) => {
      let txConceptos: any[] = [];
      try {
        txConceptos = JSON.parse(tx.detalle || '[]');
        if (!Array.isArray(txConceptos)) txConceptos = [];
      } catch (e) {
        if (typeof tx.detalle === 'string' && tx.detalle.trim().length > 0) {
          txConceptos = [{
            codigo: '-',
            descripcion: tx.detalle,
            subtotal: tx.monto_bs,
            cantidad: 1,
            total: tx.monto_bs
          }];
        }
      }
      
      txConceptos.forEach((c: any) => {
        conceptos.push(c);
        granTotalBs += c.total;
      });
    });

    let pago: any = {
      tipo_pago: 'MÚLTIPLE',
      referencia: '-',
      banco: '-',
      tasa_cambio: baseTx.tasa_cambio,
      monto_bs: baseTx.monto_bs, // will overwrite below
      monto_usd: baseTx.monto_usd
    };

    if (baseTx.formas_pago && baseTx.formas_pago.length > 0) {
      const fp = baseTx.formas_pago[0];
      pago = {
        tipo_pago: fp.metodo,
        referencia: fp.referencia || '-',
        banco: fp.banco_origen || '-',
        tasa_cambio: fp.tasa_cambio,
        monto_bs: fp.monto_bs,
        monto_usd: fp.monto_usd
      };
    } else {
      // Historical fallback
      pago = {
        tipo_pago: 'TRANSFERENCIA', // usually they are transfers in history
        referencia: 'HISTÓRICO',
        banco: '-',
        tasa_cambio: baseTx.tasa_cambio || 1,
        monto_bs: granTotalBs,
        monto_usd: granTotalBs / (baseTx.tasa_cambio || 1)
      };
    }

    const receiptData = {
      tipo: baseTx.tipo,
      numeroRecibo: baseTx.recibo,
      fecha: baseTx.fecha,
      socio: {
        ficha: baseTx.socio.ficha,
        nombre: baseTx.socio.nombre_apellido,
        cedula: baseTx.socio.cedula
      },
      conceptos,
      pago,
      granTotalBs,
      nota: ''
    };

    return NextResponse.json({ success: true, data: receiptData });
  } catch (error) {
    console.error('Error fetching recibo:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
