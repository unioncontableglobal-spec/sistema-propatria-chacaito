import prisma from './prisma';

export async function generarAsientoDesdeTransaccion(transaccionId: number) {
  const transaccion = await prisma.transaccion.findUnique({
    where: { id: transaccionId },
    include: { formas_pago: true }
  });

  if (!transaccion) return null;
  if (transaccion.asientoId) return transaccion.asientoId;

  const esIngreso = transaccion.tipo === 'INGRESO';
  const formaPago = transaccion.formas_pago[0];
  
  // 1. Determinar Cuenta de Banco/Caja
  let codigoBancoCaja = '1101'; // Default Caja
  
  if (formaPago) {
    const tipoPago = formaPago.tipo_pago.toUpperCase();
    if (tipoPago.includes('TRANSF') || tipoPago.includes('PAGO M')) {
      codigoBancoCaja = '1102'; // Bancos (simplificado)
    } else if (tipoPago.includes('USD') || tipoPago.includes('DIVISA')) {
      codigoBancoCaja = '1101003'; // Caja Moneda Extranjera
    }
  }

  // Buscar la cuenta real de Banco/Caja en el plan
  let cuentaCaja = await prisma.cuentaContable.findUnique({ where: { codigo: codigoBancoCaja } });
  if (!cuentaCaja) {
    cuentaCaja = await prisma.cuentaContable.findFirst({ where: { codigo: { startsWith: '110' } } });
  }

  // 2. Determinar Cuenta de Contrapartida desde CategoriaMovimiento
  let cuentaContra = null;
  if (transaccion.clasificacion) {
    const categoria = await prisma.categoriaMovimiento.findFirst({
      where: { nombre: transaccion.clasificacion }
    });
    
    if (categoria && categoria.codigo) {
      cuentaContra = await prisma.cuentaContable.findUnique({
        where: { codigo: categoria.codigo }
      });
    }
  }

  // Fallback si no se encontró cuenta en la categoría
  if (!cuentaContra) {
    const fallbackCode = esIngreso ? '4101' : '5101'; // Ingresos Ordinarios / Gastos Ordinarios
    cuentaContra = await prisma.cuentaContable.findUnique({ where: { codigo: fallbackCode } });
  }

  // Si no se encuentra ninguna cuenta, no podemos generar asiento (el plan está vacío)
  if (!cuentaCaja || !cuentaContra) {
    console.error(`No se encontraron cuentas para generar asiento. Caja: ${cuentaCaja?.codigo}, Contra: ${cuentaContra?.codigo}`);
    return null; 
  }

  // 3. Crear Asiento
  const count = await prisma.asientoContable.count();
  const numeroAsiento = count + 1;

  const asiento = await prisma.asientoContable.create({
    data: {
      numero: numeroAsiento,
      fecha: transaccion.fecha,
      descripcion: `${transaccion.tipo} Ref: ${transaccion.recibo} - ${transaccion.clasificacion || 'Recibo'}`,
      detalles: {
        create: [
          {
            cuentaId: esIngreso ? cuentaCaja.id : cuentaContra.id,
            debe: transaccion.monto_bs,
            haber: 0
          },
          {
            cuentaId: esIngreso ? cuentaContra.id : cuentaCaja.id,
            debe: 0,
            haber: transaccion.monto_bs
          }
        ]
      }
    }
  });

  // 4. Vincular Asiento a Transacción
  await prisma.transaccion.update({
    where: { id: transaccion.id },
    data: { asientoId: asiento.id }
  });

  return asiento;
}
