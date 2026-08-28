import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf-8');
const envVars = Object.fromEntries(
  envFile.split('\n').filter(Boolean).map(line => {
    const [key, ...val] = line.split('=');
    return [key, val.join('=').replace(/^"|"$/g, '')];
  })
);

const client = createClient({
  url: envVars.TURSO_DATABASE_URL,
  authToken: envVars.TURSO_AUTH_TOKEN,
});

const CODIGOS_INGRESOS = {
  "VIDRIOS": "1197", "MONTEPIO": "1237", "FINANZAS": "1264", "CxC 2025": "1292",
  "ABONOS": "1285", "COMISION PUNTO": "1172", "PRESTAMO": "1295", "INVENTARIO": "1158",
  "INGRESO POR REINTEGROS": "1297", "INGRESO POR DEPOSITO": "1132", "IMPUESTO CHACAO": "1310",
  "INGRESO ESTACIONAMIENTO": "600", "LOCALES ESTACIONAMIENTO": "1262", "ESTACIONAMIENTO": "1134",
  "INGRESO A CAJA": "114", "GRUA": "1276", "INGRESO A CAJA $": "1305", "TRANSFERENCIA MISMO TITULAR": "116",
  "OTROS INGRESOS": ""
};

const CODIGOS_EGRESOS = {
  "REINTEGROS": "1297", "SUMINISTROS": "1101", "NOMINA": "1303", "MANTENIMIENTO SEDE": "114",
  "MATERIAL DE OFICINA": "24", "REMANENTE": "27", "GASTOS DE REPRESENTACION": "1094",
  "GASTOS ASISTENCIA SOCIAL": "303", "GASTOS COMISION ELECTORAL": "133", "GASTOS TRANSITO Y RECLAMOS": "596",
  "GASTOS DE ADMINISTRACION": "28", "PAGO VIDRIOS": "39", "COMPRA $": "1305", "SERVICIOS BASICOS": "98",
  "GASTOS GRUA": "1276", "SEC. DEPORTE": "62", "PRESTAMOS": "7", "HONORARIOS ABOGADO": "22",
  "DONACIONES Y COLABORACIONES": "80", "TRANSFERENCIA ENTRE CUENTAS": "116", "PAGO DE AYUDAS": "112",
  "GASTOS DE ORGANIZACIÓN": "1102", "INVENTARIO": "10000", "PAGO MONTEPIO": "1237", "BONIFICACIONES": "294",
  "COMPRA CUPO": "1312", "GASTOS ESTACIONAMIENTO": "1262", "MANTENIMIENTO EQUIPOS DE OFICINA": "78",
  "OTROS EGRESOS": ""
};

async function runMigration() {
  console.log("Creating CategoriaMovimiento table...");
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "CategoriaMovimiento" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "nombre" TEXT NOT NULL,
        "tipo" TEXT NOT NULL,
        "codigo" TEXT NOT NULL,
        "activo" BOOLEAN NOT NULL DEFAULT 1
      );
    `);
    
    await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "CategoriaMovimiento_nombre_key" ON "CategoriaMovimiento"("nombre");`);
    console.log("Table CategoriaMovimiento created.");
  } catch(e) {
    console.error(e);
  }

  console.log("Seeding initial categories...");
  for (const [nombre, codigo] of Object.entries(CODIGOS_INGRESOS)) {
    try {
      await client.execute({
        sql: `INSERT OR IGNORE INTO "CategoriaMovimiento" ("nombre", "tipo", "codigo", "activo") VALUES (?, ?, ?, ?)`,
        args: [nombre, 'INGRESO', codigo, 1]
      });
    } catch(e) {
      console.error("Error seeding", nombre, e);
    }
  }

  for (const [nombre, codigo] of Object.entries(CODIGOS_EGRESOS)) {
    try {
      await client.execute({
        sql: `INSERT OR IGNORE INTO "CategoriaMovimiento" ("nombre", "tipo", "codigo", "activo") VALUES (?, ?, ?, ?)`,
        args: [nombre, 'EGRESO', codigo, 1]
      });
    } catch(e) {
      console.error("Error seeding", nombre, e);
    }
  }

  console.log("Migration complete.");
}

runMigration();
