import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const prismaClientSingleton = () => {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  // Prisma SIEMPRE requiere que DATABASE_URL exista en el entorno debido a schema.prisma,
  // incluso si usamos un driver adapter. Si Vercel no lo tiene, lo inyectamos con un dummy.
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:./dev.db";
  }

  // Si estamos en producción o si configuraste Turso localmente, usar la base de datos en la nube
  if (url && url !== "file:./dev.db") {
    const libsql = createClient({
      url,
      authToken,
    });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
  }
  
  // De lo contrario, modo local (dev.db en tu computadora)
  return new PrismaClient();
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
