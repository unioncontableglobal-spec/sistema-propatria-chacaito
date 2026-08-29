import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import dotenv from 'dotenv';
dotenv.config();

const libsql = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const id = 1; // Assuming socio ID 1 exists
    const transacciones = await prisma.transaccion.findMany({
      where: { socioId: id },
      include: {
        formas_pago: true
      },
      orderBy: { fecha: 'desc' }
    });

    const cxc = await prisma.cuentaPorCobrar.findMany({
      where: { socioId: id, estado: 'PENDIENTE' },
      orderBy: { mes: 'desc' }
    });

    const cxp = await prisma.cuentaPorPagar.findMany({
      where: { socioId: id, estado: 'PENDIENTE' },
      orderBy: { mes: 'desc' }
    });

    console.log("Success!");
    console.log({ transacciones: transacciones.length, cxc: cxc.length, cxp: cxp.length });
  } catch (error) {
    console.error("Error query:", error);
  }
}
main();
