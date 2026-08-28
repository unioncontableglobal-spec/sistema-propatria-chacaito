import prisma from '../lib/prisma';
async function main() {
  const socios = await prisma.socio.findMany({ take: 5, select: { ficha: true, nombre_apellido: true } });
  console.log(socios);
}
main().finally(() => prisma.$disconnect());
