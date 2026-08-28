import prisma from '../lib/prisma';
async function main() {
  const s = await prisma.socio.findMany({ 
    where: { 
      nombre_apellido: { contains: 'JULIO OSPINO' } 
    } 
  });
  console.log(s);
}
main().finally(() => prisma.$disconnect());
