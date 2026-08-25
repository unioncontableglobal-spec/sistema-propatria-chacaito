import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mes: string }> }
) {
  try {
    const { mes } = await params;

    // Buscar las Cuentas por Pagar (que representan los eventos pagaderos) de este mes
    const cxpRecords = await prisma.cuentaPorPagar.findMany({
      where: { mes },
      include: { socio: true }
    });

    // Mapear al formato que espera la UI (EventoParaPagar)
    const eventos = cxpRecords.map(cxp => ({
      tipo: cxp.tipo_publicacion,
      socioBeneficiarioId: cxp.socioId,
      ficha: cxp.socio.ficha,
      nombre: cxp.socio.nombre_apellido,
      parentesco: cxp.parentesco || '',
      monto: cxp.monto
    }));

    return NextResponse.json(eventos);
  } catch (error) {
    console.error('Error fetching eventos de publicacion:', error);
    return NextResponse.json({ error: 'Error al obtener eventos' }, { status: 500 });
  }
}
