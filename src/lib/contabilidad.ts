import prisma from './prisma';

export async function generarAsientoDesdeTransaccion(transaccionId: number) {
  const transaccion = await prisma.transaccion.findUnique({
    where: { id: transaccionId },
    include: { formas_pago: true }
  });

  if (!transaccion) return null;
  if (transaccion.asientoId) return transaccion.asientoId; // Already has an asiento

  const esIngreso = transaccion.tipo === 'INGRESO';
  const formaPago = transaccion.formas_pago[0];
  
  // 1. Determinar Cuenta de Banco/Caja
  let codigoBancoCaja = '1101'; // Default Caja
  let nombreBancoCaja = 'Caja General';
  
  if (formaPago) {
    if (formaPago.tipo_pago.toUpperCase().includes('TRANSF') || formaPago.tipo_pago.toUpperCase().includes('PAGO M')) {
      codigoBancoCaja = '1102'; // Banco
      nombreBancoCaja = formaPago.banco ? `Banco - ${formaPago.banco}` : 'Bancos';
    } else if (formaPago.tipo_pago.toUpperCase().includes('USD') || formaPago.tipo_pago.toUpperCase().includes('DIVISA')) {
      codigoBancoCaja = '1101003';
      nombreBancoCaja = 'Caja en Moneda Extranjera';
    }
  }

  // Ensure Banco/Caja account exists
  let cuentaCaja = await prisma.cuentaContable.findUnique({ where: { codigo: codigoBancoCaja } });
  if (!cuentaCaja) {
    cuentaCaja = await prisma.cuentaContable.create({
      data: { codigo: codigoBancoCaja, nombre: nombreBancoCaja, tipoSaldo: 'DEUDOR', clase: 'REAL' }
    });
  }

  // 2. Determinar Cuenta de Contrapartida (Ingreso o Egreso)
  let codigoContrapartida = esIngreso ? '4101' : '5101';
  let nombreContrapartida = transaccion.clasificacion || (esIngreso ? 'Ingresos Varios' : 'Gastos Varios');
  
  let cuentaContra = await prisma.cuentaContable.findUnique({ where: { codigo: codigoContrapartida } });
  if (!cuentaContra) {
    cuentaContra = await prisma.cuentaContable.create({
      data: { 
        codigo: codigoContrapartida, 
        nombre: nombreContrapartida, 
        tipoSaldo: esIngreso ? 'ACREEDOR' : 'DEUDOR', 
        clase: 'NOMINAL' 
      }
    });
  }

  // 3. Crear Asiento
  // Obtener el próximo número de asiento (simulado con count + 1)
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
