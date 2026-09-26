const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@libsql/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const fs = require('fs');

require('dotenv').config({ path: '.env.local' });
if (!process.env.TURSO_DATABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

async function upload() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("No TURSO_DATABASE_URL");
  
  process.env.DATABASE_URL = "file:./dev.db";

  const libsql = createClient({ url, authToken });
  const adapter = new PrismaLibSQL(libsql);
  const prisma = new PrismaClient({ adapter });

  const cuentas = JSON.parse(fs.readFileSync('cuentas_dump.json', 'utf8'));
  console.log(`Uploading ${cuentas.length} cuentas to Turso...`);

  let count = 0;
  for (const c of cuentas) {
    await prisma.cuentaContable.upsert({
      where: { id: c.id },
      update: c,
      create: c
    });
    count++;
  }
  
  console.log(`Successfully uploaded ${count} cuentas!`);
  await prisma.$disconnect();
}

upload().catch(console.error);
