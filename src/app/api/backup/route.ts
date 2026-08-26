import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as xlsx from 'xlsx';

export async function GET() {
  try {
    // Obtener datos de la base de datos
    const socios = await prisma.socio.findMany();
    const transacciones = await prisma.transaccion.findMany({
      include: {
        formas_pago: true,
        socio: {
          select: { nombre_apellido: true, cedula: true }
        }
      }
    });
    const cxc = await prisma.cuentaPorCobrar.findMany({
      include: {
        socio: { select: { nombre_apellido: true } }
      }
    });
    const cxp = await prisma.cuentaPorPagar.findMany({
      include: {
        socio: { select: { nombre_apellido: true } }
      }
    });

    // Crear un nuevo libro de Excel
    const workbook = xlsx.utils.book_new();

    // Hoja 1: Socios
    const sociosSheet = xlsx.utils.json_to_sheet(socios);
    xlsx.utils.book_append_sheet(workbook, sociosSheet, "Socios");

    // Hoja 2: Transacciones
    const transaccionesMapeadas = transacciones.map((t: any) => ({
      ID: t.id,
      Tipo: t.tipo,
      Fecha: t.fecha ? new Date(t.fecha).toLocaleDateString() : '',
      Mes: t.mes,
      Socio_Nombre: t.socio?.nombre_apellido || '',
      Monto_BS: t.monto_bs,
      Monto_USD: t.monto_usd || 0,
      Tasa_Cambio: t.tasa_cambio || 0,
      Clasificacion: t.clasificacion,
      Detalle: t.detalle,
      Formas_Pago: t.formas_pago.map((fp: any) => `${fp.tipo_pago} (${fp.monto_bs})`).join(', ')
    }));
    const transaccionesSheet = xlsx.utils.json_to_sheet(transaccionesMapeadas);
    xlsx.utils.book_append_sheet(workbook, transaccionesSheet, "Transacciones");

    // Hoja 3: Cuentas por Cobrar
    const cxcMapeadas = cxc.map((c: any) => ({
      ID: c.id,
      Socio_Nombre: c.socio.nombre_apellido,
      Tipo_Publicacion: c.tipo_publicacion,
      Mes: c.mes,
      Monto_Cobrar: c.monto_a_cobrar,
      Estado: c.estado
    }));
    const cxcSheet = xlsx.utils.json_to_sheet(cxcMapeadas);
    xlsx.utils.book_append_sheet(workbook, cxcSheet, "CxC");

    // Hoja 4: Cuentas por Pagar
    const cxpMapeadas = cxp.map((c: any) => ({
      ID: c.id,
      Socio_Nombre: c.socio.nombre_apellido,
      Tipo_Publicacion: c.tipo_publicacion,
      Mes: c.mes,
      Monto: c.monto,
      Total: c.total,
      Estado: c.estado
    }));
    const cxpSheet = xlsx.utils.json_to_sheet(cxpMapeadas);
    xlsx.utils.book_append_sheet(workbook, cxpSheet, "CxP");

    // Generar archivo binario
    const buf = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Configurar encabezados para descarga
    const headers = new Headers();
    headers.set(
      'Content-Disposition',
      `attachment; filename="Respaldo_Sistema_Propatria_${new Date().toISOString().split('T')[0]}.xlsx"`
    );
    headers.set(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    return new NextResponse(buf, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error("Error al generar respaldo:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al generar el respaldo" },
      { status: 500 }
    );
  }
}
