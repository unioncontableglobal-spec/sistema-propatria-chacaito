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
  const transacciones = await prisma.transaccion.findMany({
    where: { asientoId: null },
    include: { formas_pago: true, socio: true }
  });

  const pendientes = transacciones.filter(t => {
    if (!t.fecha) return false;
    const d = new Date(t.fecha);
    return d.getFullYear() === 2026 && (d.getMonth() + 1) === 1;
  });
  console.log('Pendientes:', pendientes.length);

  const cuentas = await prisma.cuentaContable.findMany();
  const mapCuentas = new Map(cuentas.map(c => [c.codigo, c.id]));

  const DEFAULT_CAJA = mapCuentas.get('1101001');
  const INGRESO_FINANZAS = mapCuentas.get('4102002');
  const INGRESO_SOSTENIMIENTO = mapCuentas.get('4102003');
  const GASTO_DEFAULT = mapCuentas.get('6106009');
  
  let count = 0;
  const ops = [];

  const lastAsiento = await prisma.asientoContable.findFirst({ orderBy: { numero: 'desc' } });
  const startNumero = lastAsiento ? lastAsiento.numero + 1 : 1;
  console.log('Start Numero:', startNumero);

  for (const t of pendientes) {
    ops.push({ transaccion: t, cuentaDebe: DEFAULT_CAJA, cuentaHaber: INGRESO_FINANZAS, numero: startNumero + count, descripcion: 'Test' });
    count++;
  }

  const chunkSize = 50; 
  for (let i = 0; i < ops.length; i += chunkSize) {
    const chunk = ops.slice(i, i + chunkSize);
    console.log(`Executing chunk ${i} to ${i + chunkSize}...`);
    await Promise.all(chunk.map(async (op) => {
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
      await prisma.transaccion.update({ where: { id: op.transaccion.id }, data: { asientoId: asiento.id } });
    }));
  }
  console.log('Done');
}
main().catch(console.error).finally(() => process.exit(0));
