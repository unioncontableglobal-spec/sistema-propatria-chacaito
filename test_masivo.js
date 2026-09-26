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
  console.log("Pendientes: ", pendientes.length);

  const cuentas = await prisma.cuentaContable.findMany();
  const mapCuentas = new Map(cuentas.map(c => [c.codigo, c.id]));

  const DEFAULT_CAJA = mapCuentas.get('1101001');
  const INGRESO_FINANZAS = mapCuentas.get('4102002');
  const INGRESO_SOSTENIMIENTO = mapCuentas.get('4102003');
  const GASTO_DEFAULT = mapCuentas.get('6106009');
  const GASTO_PERSONAL = mapCuentas.get('6106005');
  const GASTO_BANCARIO = mapCuentas.get('6106006');

  // test first one
  const t = pendientes[0];
  if (!t) return console.log('no t');
  let bancoId = DEFAULT_CAJA;
  if (t.formas_pago && t.formas_pago.length > 0) {
    const fp = t.formas_pago[0];
    const tipoPago = fp.tipo_pago.toUpperCase();
    const b = (fp.banco || '').toUpperCase();
    if (tipoPago.includes('EFECTIVO')) bancoId = mapCuentas.get('1101001');
    else if (b.includes('BANCAMIGA-9750')) bancoId = mapCuentas.get('1102005');
  }

  let cuentaDebe = undefined;
  let cuentaHaber = undefined;
  if (t.tipo === 'INGRESO') {
    cuentaDebe = bancoId || DEFAULT_CAJA;
    cuentaHaber = INGRESO_FINANZAS;
  }
  console.log("Debe: ", cuentaDebe, "Haber: ", cuentaHaber);
}
main().catch(console.error).finally(() => process.exit(0));
