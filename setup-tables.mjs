import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const libsql = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  try {
    console.log("Checking if CuentaPorCobrar exists...");
    
    await libsql.execute(`
      CREATE TABLE IF NOT EXISTS CuentaPorCobrar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        socioId INTEGER NOT NULL,
        tipo_publicacion TEXT,
        mes TEXT,
        monto_a_cobrar REAL NOT NULL,
        estado TEXT NOT NULL DEFAULT 'PENDIENTE',
        FOREIGN KEY (socioId) REFERENCES Socio(id)
      )
    `);
    console.log("CuentaPorCobrar created or already exists.");

    await libsql.execute(`
      CREATE TABLE IF NOT EXISTS CuentaPorPagar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        socioId INTEGER NOT NULL,
        tipo_publicacion TEXT,
        parentesco TEXT,
        mes TEXT,
        monto REAL NOT NULL,
        total REAL,
        estado TEXT NOT NULL DEFAULT 'PENDIENTE',
        FOREIGN KEY (socioId) REFERENCES Socio(id)
      )
    `);
    console.log("CuentaPorPagar created or already exists.");
    
  } catch (e) {
    console.error("Error creating tables:", e);
  }
}
main();
