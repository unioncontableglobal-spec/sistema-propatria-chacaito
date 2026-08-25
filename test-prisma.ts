import prisma from './src/lib/prisma';
async function main() {
  try {
    const res = await prisma.socio.findMany({ take: 5 });
    console.log("Success:", res.length);
  } catch (e) {
    console.error("Prisma error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
