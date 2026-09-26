import prisma from './src/lib/prisma';

async function main() {
  const tCount = await prisma.transaccion.count();
  const sCount = await prisma.socio.count();
  console.log(`Turso tiene ${tCount} transacciones y ${sCount} socios.`);
}

main().catch(console.error).finally(() => process.exit(0));
