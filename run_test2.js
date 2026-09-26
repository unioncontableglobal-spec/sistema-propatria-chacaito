const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@libsql/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
require('dotenv').config({ path: '.env.local' });
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const libsql = createClient({ url, authToken });
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
  const [year, month] = ['2026', '01'];

  const transacciones = await prisma.transaccion.findMany({
    where: { asientoId: null },
    include: { formas_pago: true, socio: true }
  });

  const pendientes = transacciones.filter(t => {
    if (!t.fecha) return false;
    const d = new Date(t.fecha);
    return d.getFullYear() === Number(year) && (d.getMonth() + 1) === Number(month);
  });
  console.log('Pendientes:', pendientes.length);

  const cuentas = await prisma.cuentaContable.findMany();
  const mapCuentas = new Map(cuentas.map(c => [c.codigo, c.id]));

  const DEFAULT_CAJA = mapCuentas.get('1101001');
  const INGRESO_FINANZAS = mapCuentas.get('4102002');
  const INGRESO_SOSTENIMIENTO = mapCuentas.get('4102003');
  const GASTO_DEFAULT = mapCuentas.get('6106009');
  const GASTO_PERSONAL = mapCuentas.get('6106005');
  const GASTO_BANCARIO = mapCuentas.get('6106006');

  let count = 0;
  const ops = [];

  const lastAsiento = await prisma.asientoContable.findFirst({
    orderBy: { numero: 'desc' }
  });
  const startNumero = lastAsiento ? lastAsiento.numero + 1 : 1;
  console.log('Start Numero:', startNumero);

  for (const t of pendientes) {
    let bancoId = DEFAULT_CAJA;
    if (t.formas_pago && t.formas_pago.length > 0) {
      const fp = t.formas_pago[0];
      const tipoPago = fp.tipo_pago.toUpperCase();
      const b = (fp.banco || '').toUpperCase();
      if (tipoPago.includes('EFECTIVO')) bancoId = mapCuentas.get('1101001');
      else if (b.includes('BANCAMIGA-9750')) bancoId = mapCuentas.get('1102005');
      else if (b.includes('BANCAMIGA')) bancoId = mapCuentas.get('1102001');
      else if (b.includes('BANESCO')) bancoId = mapCuentas.get('1102004');
      else if (b.includes('MERCANTIL')) bancoId = mapCuentas.get('1102002');
      else if (b.includes('VENEZUELA')) bancoId = mapCuentas.get('1102003');
      else if (b.includes('A.C.P.C.CH')) bancoId = mapCuentas.get('1102006');
    }

    let cuentaDebe = undefined;
    let cuentaHaber = undefined;
    const classUpper = (t.clasificacion || '').toUpperCase();
    const concUpper = (t.codigo_concepto || '').toUpperCase();

    if (t.tipo === 'INGRESO') {
      cuentaDebe = bancoId || DEFAULT_CAJA;
      if (classUpper.includes('FINANZAS') || concUpper.includes('FINANZAS')) cuentaHaber = INGRESO_FINANZAS;
      else cuentaHaber = INGRESO_SOSTENIMIENTO;
    } else {
      cuentaHaber = bancoId || DEFAULT_CAJA;
      if (classUpper.includes('SUELDO') || classUpper.includes('PERSONAL') || classUpper.includes('HONORARIO')) cuentaDebe = GASTO_PERSONAL;
      else if (classUpper.includes('BANCO') || classUpper.includes('COMISION')) cuentaDebe = GASTO_BANCARIO;
      else cuentaDebe = GASTO_DEFAULT;
    }

    if (!cuentaDebe || !cuentaHaber) continue;
    
    const numero = startNumero + count; 

    ops.push(prisma.asientoContable.create({
      data: {
        numero,
        fecha: t.fecha,
        descripcion: "Test",
        detalles: {
          create: [
            { cuentaId: cuentaDebe, debe: t.monto_bs, haber: 0 },
            { cuentaId: cuentaHaber, debe: 0, haber: t.monto_bs }
          ]
        }
      }
    }));

    ops.push(prisma.transaccion.update({
      where: { id: t.id },
      data: { asientoId: numero }
    }));
    
    count++;
  }

  console.log('Ops to execute:', ops.length);
  try {
    const chunkSize = 100;
    for (let i = 0; i < ops.length; i += chunkSize) {
      console.log(`Executing chunk ${i} to ${i + chunkSize}...`);
      await prisma.$transaction(ops.slice(i, i + chunkSize));
    }
    console.log('All chunks OK');
  } catch(e) {
    console.log('Error executing chunk:', e);
  }
}
main().catch(console.error).finally(() => process.exit(0));
