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

  for (const t of pendientes) {
    const socioNombre = t.socio ? ` - ${t.socio.nombre_apellido}` : '';
    const concepto = t.codigo_concepto || t.clasificacion || t.detalle || '';
    
    let pagoStr = '';
    let bancoId = DEFAULT_CAJA;

    if (t.formas_pago && t.formas_pago.length > 0) {
      const fp = t.formas_pago[0];
      pagoStr = ` (Vía: ${fp.tipo_pago}${fp.banco ? ` ${fp.banco}` : ''}${fp.referencia ? ` Ref: ${fp.referencia}` : ''})`;
      
      const tipoPago = fp.tipo_pago.toUpperCase();
      const b = (fp.banco || '').toUpperCase();
      
      if (tipoPago.includes('EFECTIVO')) {
        bancoId = mapCuentas.get('1101001');
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

    let cuentaDebe = undefined;
    let cuentaHaber = undefined;

    if (t.tipo === 'INGRESO') {
      cuentaDebe = bancoId || DEFAULT_CAJA;
      cuentaHaber = INGRESO_FINANZAS; // Dummy logic for test
    }

    if (!cuentaDebe || !cuentaHaber) continue;
    
    const numero = startNumero + count; 

    ops.push(prisma.asientoContable.create({
      data: {
        numero,
        fecha: t.fecha,
        descripcion: `Test ${numero}`,
        detalles: {
          create: [
            { cuentaId: cuentaDebe, debe: t.monto_bs, haber: 0 },
            { cuentaId: cuentaHaber, debe: 0, haber: t.monto_bs }
          ]
        },
        transaccion: {
          connect: { id: t.id }
        }
      }
    }));
    count++;
  }

  console.log('Ops to execute:', ops.length);
  try {
    const chunkSize = 100;
    // Execute just the first chunk
    await prisma.$transaction(ops.slice(0, chunkSize));
    console.log('First chunk OK');
  } catch(e) {
    console.error('Error executing chunk:', e);
  }
}
main().catch(console.error).finally(() => process.exit(0));
